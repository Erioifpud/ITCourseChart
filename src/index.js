import echarts from 'echarts'
import './sdk.min'
import './global.css'

function debounce (fn, delay = 500) {
  let timer
  return function () {
    const args = arguments
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      timer = null
      fn.apply(this, args)
    }, delay)
  }
}

function getNewPoints () {
  const hash = window.location.hash
  if (!hash.trim()) {
    window.alert('参数错误')
    return
  }
  const params = hash.slice(1, hash.length)
  const [id, key] = params.split(',')
  var api = new OneNetApi(key)
  const promise = new Promise((resolve, reject) => {
    api.getDataPoints(id, { limit: '10' }).done(async (resp) => {
      const { errno, error, data } = resp
      // 请求异常
      if (errno !== 0) {
        reject(error)
      }
      const datastreams = data.datastreams
      // 没创建数据流
      if (datastreams.length === 0) {
        reject('数据流不能为空')
      }
      const datapoints = datastreams[0].datapoints
      const mappedPoints = datapoints.map(({ at, value }) => ({
        name: `${at}${value}`,
        value: [at, value]
      }))
      resolve(mappedPoints)
    })
  })
  return promise
}

function initTimer (chartInstance) {
  let timer = setInterval(async () => {
    try {
      const data = await getNewPoints()
      if (!data) {
        clearInterval(timer)
        return
      }
      chartInstance.setOption({
        series: [{
          data 
        }]
      })
    } catch (err) {
      clearInterval(timer)
      window.alert(err)
    }
  }, 3000)
}

window.onload = function () {
  const chartElement = document.createElement('div')
  chartElement.style.height = '100%'
  chartElement.style.width = '100%'
  document.body.appendChild(chartElement)

  // echart
  var myChart = echarts.init(chartElement)
  const option = {
    xAxis: {
      type: 'time',
      name: '时间',
      axisLabel: {
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      name: '数值'
    },
    series: [{
      name: '数据集',
      data: [],
      type: 'line',
      symbolSize: 10,
      itemStyle: {
        normal: {
          lineStyle: {
            width: 4
          }
        }
      }
    }],
    legend: {
      data:['数据集']
    },
    tooltip : {
      trigger: 'axis'
    }
  }
  myChart.setOption(option)

  window.onresize = debounce(myChart.resize)
  initTimer(myChart)
}