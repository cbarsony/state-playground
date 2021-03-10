import _ from 'lodash'

const delay = 500 //ms

const mockImages = _.range(0, 100).map(n => ({
  fileName: `img_${n}.jpg`,
  thumb: `https://picsum.photos/id/${n}/100`,
  metaList: [
    {
      key: 'job',
      value: 'job1',
    },
    {
      key: 'index',
      value: `${n}`,
    },
  ],
}))

mockImages[0].metaList.push({
  key: 'tk',
  value: 'tv',
})

mockImages[1].metaList.push({
  key: 'tk',
  value: 'tv',
})

mockImages[2].metaList.push({
  key: 'tk',
  value: 'tv',
})

const doMetaMatch = (metaFilters, fileMetaList) => {
  let result = true

  metaFilters.forEach(metaFilter => {
    const fileMeta = fileMetaList.find(fileMeta => {
      return fileMeta.key === metaFilter.key
    })

    if(fileMeta === undefined) {
      result = false
    }
    else if(fileMeta.value !== metaFilter.value) {
      result = false
    }
  })

  return result
}

const editImageMeta = (image, meta) => {
  const existingImageMeta = image.metaList.find(imageMeta => imageMeta.key === meta.key)

  if(existingImageMeta) {
    existingImageMeta.value = meta.value
  }
  else {
    image.metaList.push(meta)
  }
}

export const server = {
  getImages: async(fileNameFilter, metaFilters) => {
    return new Promise(resolve => {
      setTimeout(() => {
        const resultList = mockImages.filter(image => {
          return doMetaMatch(metaFilters, image.metaList)
        })

        resolve({
          fileInfoList: resultList,
          fileInfoCount: resultList.length,
        })
      }, delay)
    })
  },
  deleteFileMeta: async(fileName, metaKey) => {
    return new Promise(resolve => {
      setTimeout(() => {
        const file = mockImages.find(i => i.fileName === fileName)
        _.remove(file.metaList, meta => meta.key === metaKey)

        resolve()
      }, delay)
    })
  },
  updateFileMeta: async(fileNameList, meta) => {
    mockImages.forEach(image => {
      if(_.includes(fileNameList, image.fileName)) {
        editImageMeta(image, meta)
      }
    })
  },
}
