import {Fragment, useState, useEffect} from 'react'
import update from 'immutability-helper'
import _ from 'lodash'
import {Machine, assign} from 'xstate'
import {useMachine} from '@xstate/react'

import {server} from './server'

const STATE = {
  LOADING: 'LOADING',
  LISTING: 'LISTING',
  ADDING_META_FILTER: 'ADDING_META_FILTER',
  DELETING_META_FILTER: 'DELETING_META_FILTER',
  ADDING_FILE_META: 'ADDING_FILE_META',
  DELETING_FILE_META: 'DELETING_FILE_META',
  UPDATING_FILE_META: 'UPDATING_FILE_META',
}

const EVENT = {
  READY: 'READY',
  CANCEL: 'CANCEL',
  ADD_META_FILTER: 'ADD_META_FILTER',
  DELETE_META_FILTER: 'DELETE_META_FILTER',
  ADD_FILE_META: 'ADD_FILE_META',
  DELETE_FILE_META: 'DELETE_FILE_META',
  SELECT_FILE: 'SELECT_FILE',
}

const imageManagerSM = {
  id: 'imageManagerSM',
  initial: STATE.LOADING,
  context: {
    fileInfoList: [],
    fileInfoCount: 0,
    selectedImageIdxList: [],
    metaFilterList: [{
      key: 'tk',
      value: 'tv',
    }],
    fileNameFilter: '',
  },
  states: {
    [STATE.LOADING]: {
      invoke: {
        src: 'getImages',
        onDone: STATE.LISTING,
      },
      entry: assign(() => ({selectedImageIdxList: []})),
      exit: assign((context, {data}) => data),
    },
    [STATE.LISTING]: {
      on: {
        [EVENT.SELECT_FILE]: {
          //could be simplified with SELECT/DESELECT_FILE
          actions: [assign((context, {fileInfoIdx}) => {
            let selectedImageIdxList

            if(_.includes(context.selectedImageIdxList, fileInfoIdx)) {
              const selectedIdx = context.selectedImageIdxList.findIndex(idx => idx === fileInfoIdx)

              selectedImageIdxList = update(context.selectedImageIdxList, {
                $splice: [[selectedIdx, 1]],
              })
            }
            else {
              selectedImageIdxList = update(context.selectedImageIdxList, {
                $push: [fileInfoIdx],
              })
            }

            return {selectedImageIdxList}
          })],
        },

        [EVENT.ADD_META_FILTER]: STATE.ADDING_META_FILTER,
        [EVENT.DELETE_META_FILTER]: STATE.DELETING_META_FILTER,

        [EVENT.ADD_FILE_META]: STATE.ADDING_FILE_META,
        [EVENT.DELETE_FILE_META]: STATE.DELETING_FILE_META,
      },
    },
    [STATE.ADDING_META_FILTER]: {
      on: {
        [EVENT.READY]: {
          target: STATE.LOADING,
          actions: [
            assign((context, {data}) => {
              const metaFilterList = update(context.metaFilterList, {$push: [data]})

              return {metaFilterList}
            }),
          ],
        },
        [EVENT.CANCEL]: STATE.LISTING,
      },
    },
    [STATE.DELETING_META_FILTER]: {
      always: STATE.LOADING,
      entry: assign((context, {data}) => {
        const metaFilterList = update(context.metaFilterList, {
          $splice: [[data.metaFilterIdxToRemove, 1]],
        })

        return {metaFilterList}
      }),
    },
    [STATE.ADDING_FILE_META]: {
      on: {
        [EVENT.READY]: STATE.UPDATING_FILE_META,
        [EVENT.CANCEL]: STATE.UPDATING_FILE_META,
      },
    },
    [STATE.UPDATING_FILE_META]: {
      invoke: {
        src: 'updateFileMeta',
        onDone: STATE.LOADING,
      },
      exit: assign((context, {data}) => data),
    },
    [STATE.DELETING_FILE_META]: {
      invoke: {
        src: 'deleteFileMeta',
        onDone: STATE.LOADING,
      },
    },
  },
}

const imageManagerSMOptions = {
  services: {
    getImages: async(context) => {
      const fileInfoListPayload = await server.getImages(context.fileNameFilter, context.metaFilterList)

      return {
        fileInfoList: fileInfoListPayload.fileInfoList,
        fileInfoCount: fileInfoListPayload.fileInfoCount,
      }
    },
    deleteFileMeta: async(context, {metaIdx}) => {
      const fileName = context.fileInfoList[context.selectedImageIdxList[0]].fileName
      const metaKey = context.fileInfoList[context.selectedImageIdxList[0]].metaList[metaIdx].key

      await server.deleteFileMeta(fileName, metaKey)
    },
    updateFileMeta: async(context, {meta}) => {
      const images = context.fileInfoList
        .filter((fileInfo, fileInfoIdx) => _.includes(context.selectedImageIdxList, fileInfoIdx))
        .map(fileInfo => fileInfo.fileName)

      await server.updateFileMeta(images, meta)
    },
  },
}

export const ImageManager = () => {
  const [state, send, service] = useMachine(Machine(imageManagerSM, imageManagerSMOptions))

  const [metaInputKey, setMetaInputKey] = useState('')
  const [metaInputValue, setMetaInputValue] = useState('')

  const [fileMetaInputKey, setFileMetaInputKey] = useState('')
  const [fileMetaInputValue, setFileMetaInputValue] = useState('')

  const isOKMetaFilterButtonDisabled = () => metaInputKey === '' || metaInputValue === ''
  const isOKFileMetaButtonDisabled = () => fileMetaInputKey === '' || fileMetaInputValue === ''

  /******** logging **********/
  useEffect(() => service.subscribe(state => console.log(state)), [service])

  return (
    <Fragment>
      <div id="Sidebar">
        <div>
          <h3>Metadata Filter</h3>
          <div>
            {state.context.metaFilterList.map((metaFilter, metaFilterIdx) => (
              <div key={metaFilterIdx}>
                <span>{metaFilter.key}</span>:
                <span>{metaFilter.value}</span>
                <button
                  onClick={() => {
                    send(EVENT.DELETE_META_FILTER, {
                      data: {
                        metaFilterIdxToRemove: metaFilterIdx,
                      },
                    })
                  }}
                >X</button>
              </div>
            ))}
          </div>
          {state.matches(STATE.ADDING_META_FILTER) ? (
            <div>
              <input
                type="text"
                value={metaInputKey}
                onChange={e => setMetaInputKey(e.target.value)}
              />
              <input
                type="text"
                value={metaInputValue}
                onChange={e => setMetaInputValue(e.target.value)}
              />
              <button
                onClick={() => {
                  send(EVENT.READY, {
                    data: {
                      key: metaInputKey,
                      value: metaInputValue,
                    },
                  })
                  setMetaInputKey('')
                  setMetaInputValue('')
                }}
                disabled={isOKMetaFilterButtonDisabled()}
              >OK</button>
              <button
                onClick={() => {
                  send(EVENT.CANCEL, {data: 'cancel'})
                  setMetaInputKey('')
                  setMetaInputValue('')
                }}
              >Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => {
                send(EVENT.ADD_META_FILTER, {
                  data: {
                    exampleKey: 'exampleValue',
                  },
                })
              }}
            >Add MetaFilter</button>
          )}
        </div>

        <div>
          <h3>File Metadata</h3>
          {state.context.selectedImageIdxList.length === 1 && state.context.fileInfoList[state.context.selectedImageIdxList[0]].metaList.map((meta, metaIdx) => (
            <div key={metaIdx}>
              {`${meta.key}: ${meta.value}`}
              <button
                onClick={() => send(EVENT.DELETE_FILE_META, {metaIdx})}
              >X</button>
            </div>
          ))}
          {state.context.selectedImageIdxList.length > 0 && (
            <button
              onClick={() => send(EVENT.ADD_FILE_META)}
            >Add Metadata to file</button>
          )}
          {state.matches(STATE.ADDING_FILE_META) && (
            <div>
              <input
                type="text"
                value={fileMetaInputKey}
                onChange={e => setFileMetaInputKey(e.target.value)}
              />
              <input
                type="text"
                value={fileMetaInputValue}
                onChange={e => setFileMetaInputValue(e.target.value)}
              />
              <button
                onClick={() => {
                  send(EVENT.READY, {
                    meta: {
                      key: fileMetaInputKey,
                      value: fileMetaInputValue,
                    },
                  })
                  setFileMetaInputKey('')
                  setFileMetaInputValue('')
                }}
                disabled={isOKFileMetaButtonDisabled()}
              >OK</button>
              <button
                onClick={() => {
                  send(EVENT.CANCEL, {data: 'cancel'})
                  setFileMetaInputKey('')
                  setFileMetaInputValue('')
                }}
              >Cancel</button>
            </div>
          )}
        </div>

      </div>
      <div id="ImageManager">
        {state.context.fileInfoList.length === 0 && <div>empty image list...</div>}
        {state.matches(STATE.LOADING) ? <div>loading...</div> : state.context.fileInfoList.map((fileInfo, fileInfoIdx) => (
          <div
            className="image"
            key={fileInfoIdx}
            onClick={() => send(EVENT.SELECT_FILE, {fileInfoIdx})}
          >
            <span className={_.includes(state.context.selectedImageIdxList, fileInfoIdx) ? 'active' : ''}>{fileInfo.fileName}</span>
          </div>
        ))}
      </div>
    </Fragment>
  )
}
