import {Fragment, useEffect, useRef} from 'react'
import update from 'immutability-helper'
import _ from 'lodash'
import {Machine, assign} from 'xstate'
import {useMachine} from '@xstate/react'

import {server} from './server'

const STATE = {
  LOADING: 'LOADING',
  LISTING: 'LISTING',
  CHANGING_META_FILTER: 'CHANGING_META_FILTER',
  ADDING_META_FILTER: 'ADDING_META_FILTER',
  EDITING_META_FILTER: 'EDITING_META_FILTER',
  DELETING_META_FILTER: 'DELETING_META_FILTER',
  CHANGING_FILE_META: 'CHANGING_FILE_META',
  ADDING_FILE_META: 'ADDING_FILE_META',
  EDITING_FILE_META: 'EDITING_FILE_META',
}

const EVENT = {
  LOADED: 'LOADED',
  ADD_META_FILTER: 'ADD_META_FILTER',
  EDIT_META_FILTER: 'EDIT_META_FILTER',
  DELETE_META_FILTER: 'DELETE_META_FILTER',
  ADD_FILE_META: 'ADD_FILE_META',
  EDIT_FILE_META: 'EDIT_FILE_META',
  DELETE_FILE_META: 'DELETE_FILE_META',
  SUCCESS: 'SUCCESS',
}

const imageManagerSM = {
  id: 'imageManagerSM',
  initial: STATE.LOADING,
  context: {
    fileInfoList: [],
    fileInfoCount: 0,
    selectedImageIdxList: [],
    metaFilterList: [{
      key: 'job',
      value: 'job1',
    }],
    fileNameFilter: '',
  },
  states: {
    [STATE.LOADING]: {
      id: STATE.LOADING,
      invoke: {
        src: 'getImages',
        onDone: STATE.LISTING,
      },
      exit: assign((context, {data}) => data)
    },
    [STATE.LISTING]: {
      on: {
        [EVENT.ADD_META_FILTER]: `${STATE.CHANGING_META_FILTER}.${STATE.ADDING_META_FILTER}`,
        [EVENT.DELETE_META_FILTER]: `${STATE.CHANGING_META_FILTER}.${STATE.DELETING_META_FILTER}`,
      },
    },
    [STATE.CHANGING_META_FILTER]: {
      states: {
        [STATE.ADDING_META_FILTER]: {
          exit: assign((context, {data}) => {
            const metaFilterList = update(context.metaFilterList, {
              $push: [data],
            })

            return {metaFilterList}
          }),
          on: {
            [EVENT.SUCCESS]: `#${STATE.LOADING}`,
          },
        },
        [STATE.EDITING_META_FILTER]: {},
        [STATE.DELETING_META_FILTER]: {
          always: `#${STATE.LOADING}`,
          entry: assign((context, {data}) => {
            const metaFilterList = update(context.metaFilterList, {
              $splice: [[data.metaFilterIdxToRemove, 1]],
            })

            return {metaFilterList}
          }),
        },
      },
    },
    [STATE.CHANGING_FILE_META]: {},
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
  },
}

export const ImageManager = () => {
  const metaFilterKeyInputRef = useRef(null)
  const metaFilterValueInputRef = useRef(null)
  const [state, send, service] = useMachine(Machine(imageManagerSM, imageManagerSMOptions))
  useEffect(() => service.subscribe(state => console.log(state)), [service])

  return (
    <Fragment>
      <div className="SidebarContent">
        <div>
          <div>
            {state.context.metaFilterList.map((metaFilter, metaFilterIdx) => (
              <div key={metaFilterIdx}>
                <span>{metaFilter.key}</span>:
                <span
                  onDoubleClick={() => {
                    send(EVENT.EDIT_META_FILTER, {
                      data: {
                        metaFilterIdx,
                      }
                    })
                  }}
                >{metaFilter.value}</span>
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
              <input type="text" ref={metaFilterKeyInputRef}/>
              <input type="text" ref={metaFilterValueInputRef}/>
              <button onClick={() => {
                if(metaFilterKeyInputRef === '' && metaFilterValueInputRef === '') {
                  return
                }

                send(EVENT.SUCCESS)
              }}>OK</button>
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
          <div>Meta...</div>
        </div>

        <div>
          <div>Under construction...</div>
        </div>

      </div>
      <div id="ImageManager">
        {state.matches(STATE.LOADING) ? <div>loading...</div> : state.context.fileInfoList.map((fileInfo, fileInfoIdx) => (
          <div
            className="image"
            key={fileInfoIdx}
            onClick={() => {
              if(_.includes(state.context.selectedImageIdxList, fileInfoIdx)) {
                //const selectedIdx = state.context.selectedImageIdxList.findIndex(idx => idx === fileInfoIdx)

                /*this.setState(state => update(state, {
                 selectedImageIdxList: {
                 $splice: [[selectedIdx, 1]],
                 },
                 }))*/
              }
              else {
                /*this.setState(state => update(state, {
                 selectedImageIdxList: {
                 $push: [fileInfoIdx],
                 },
                 }))*/
              }
            }}>
            <span className={_.includes(state.context.selectedImageIdxList, fileInfoIdx) ? 'active' : ''}>{fileInfo.fileName}</span>
          </div>
        ))}
      </div>
    </Fragment>
  )
}
