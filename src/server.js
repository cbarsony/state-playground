import _ from 'lodash'

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
      }, 500)
    })
  },
}
