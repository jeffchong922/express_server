import axios from 'axios'
import { CONSTELLATION_API_URL, CONSTELLATIONS_APP_KEY } from '../../_helpers'

// db 为 Map 类型，使用内存存储数据
export default function makeConstellationsDb ({ makeDb }) {
  return Object.freeze({
    findByType
  })

  async function findByType ({ type, consName }) {
    const db = await makeDb()
    let typeMap = db.get(type)

    if (!typeMap) {
      typeMap = new Map()
      db.set(type, typeMap)
    }

    if (!typeMap.get(consName)) {
      const data = await fetchConstellations({ type, consName })
      if ((typeof data.error_code !== 'undefined') && (data.error_code === 0)) {
        typeMap.set(consName, data)
      }
    }

    const oldData = typeMap.get(consName)
    if (oldData && isNeedToUpdate(type, oldData)) {
      const data = await fetchConstellations({ type, consName })
      if ((typeof data.error_code !== 'undefined') && (data.error_code === 0)) {
        typeMap.set(consName, data)
      }
    }

    return typeMap.get(consName) || null
  }

  // 只为当前数据而用
  function isNeedToUpdate (type, data) {
    let oDate
    // 调整时区 和 延后半小时
    let nDate = Date.now() + (1000 * 60 * 60 * 8) - (1000 * 60 * 30)
    switch (type) {
      case 'today':
        oDate = data.date
        nDate = Number(new Date(nDate).toISOString().slice(0, 10).replace(/-/g, ''))
        break
      case 'tomorrow':
        oDate = data.date
        nDate = Number(new Date(nDate + (1000 * 60 * 60 * 24)).toISOString().slice(0, 10).replace(/-/g, ''))
        break
      case 'week':
        oDate = data.weekth
        nDate = getWeekOfYear(nDate)
        break
      case 'month':
        oDate = data.month
        nDate = new Date(nDate).getMonth() + 1
        break
      case 'year':
        oDate = data.year
        nDate = new Date(nDate).getFullYear()
        break
      default:
        throw new Error('Unknown type')
    }
    return oDate !== nDate
  }

  async function fetchConstellations ({ consName, type }) {
    const { data } = await axios.get(CONSTELLATION_API_URL, {
      params: {
        consName,
        type,
        key: CONSTELLATIONS_APP_KEY
      }
    })
    return data
  }

  // 参考：https://blog.csdn.net/ziwen00/article/details/12579305
  function getWeekOfYear (timestamp) {
    const checkDate = new Date(timestamp)
    checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7))
    const time = checkDate.getTime()
    checkDate.setMonth(0)
    checkDate.setDate(1)
    const week = Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1
    return week
  }
}
