<template>
  <div class="app-container">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item>全国物联网设备</el-breadcrumb-item>
    </el-breadcrumb>
    <el-divider></el-divider>

    <el-form ref="form" :model="form" label-width="80px">
      <el-row>
        <el-col :span="6">

          <el-form-item label="起始IP">
            <el-input v-model="form.start_ip"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="6">

          <el-form-item label="结束IP">
            <el-input v-model="form.end_ip"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="6">

          <el-form-item label="代理">
            <el-input v-model="form.proxy" placeholder="socks5代理"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="startScan" :loading="loading">开始扫描</el-button>
        </el-col>
      </el-row>
    </el-form>

    <div :style="{height:height,width:width}" ref="myEchart"></div>
    <div style="margin-top: 30px">
      <el-table
        :data="tableData"
        style="width: 100%;margin-bottom: 20px;"
        row-key="id"
        border
        :loading="loading"
        :tree-props="{children: 'children', hasChildren: 'hasChildren'}">
        <el-table-column
          prop="device_name"
          label="设备名"
        >
        </el-table-column>
        <el-table-column
          prop="ip_v4"
          label="IP"
        >
        </el-table-column>
        <el-table-column
          prop="country"
          label="所在国家">
        </el-table-column>
        <el-table-column
          prop="ports"
          label="开放端口">
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
// import echarts from 'echarts';
import '../../world.js'

import {sendScan, checkScanStatus} from '@/api/form'


export default {
  components: {},
  provide: {},
  props: {
    width: {type: String, default: "100%"},
    height: {type: String, default: "500px"}
  },
  data() {
    return {
      loading: false,
      form: {
        start_ip: '',
        end_ip: '',
        proxy: ''
      },
      scan_id: null,
      tableData: [],
      intervalID: null,
      geos: [],

    }
  }
  ,
  mounted() {
    this.initChart();
  }
  ,
  methods: {

    async checkStatus() {
      if (!this.scan_id) {
        return
      }
      const _this = this
      const response = await checkScanStatus(this.scan_id)
      if (response.data.ok === true) {
        // 扫描完成了
        _this.loading = false
        _this.$message({
          message: '恭喜你，扫描完成了',
          type: 'success'
        });
        clearInterval(_this.intervalID)
        _this.intervalID = null
        this.tableData = response.data.cve_data
        this.geos = response.data.geos
        this.initChart()
      }

    },

    async startScan() {
      const _this = this
      _this.loading = true
      if (!this.form.start_ip || !this.form.end_ip) {
        return
      }
      const result = await sendScan(this.form)
      if (result.code === 20000) {
        _this.$message({
          message: '恭喜你，开始扫描',
          type: 'success'
        });
        _this.scan_id = result.data.scan_id

        _this.intervalID = setInterval(() => {
          _this.checkStatus()
        }, 2000)

      } else {
        this.$message.error(result.message);
      }
      console.log(result)

    },
    initChart() {
      const myChart = echarts.init(this.$refs.myEchart)

      // 小飞机的图标，可以用其他图形替换
      const planePath =
        'path://M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l330.343-157.288l12.238,241.308l-134.449,92.931l0.531,42.034l175.125-42.917l175.125,42.917l0.531-42.034l-134.449-92.931l12.238-241.308L1705.06,1318.313z'

      var color = ['#9ae5fc', '#dcbf71']; // 自定义图中要用到的颜色
      var series = []; // 用来存储地图数据

      series.push({
        // 白色航线特效图
        type: 'lines',
        zlevel: 1, // 用于分层，z-index的效果
        effect: {
          show: true, // 动效是否显示
          period: 6, // 特效动画时间
          trailLength: 0.7, // 特效尾迹的长度
          color: '#fff', // 特效颜色
          symbolSize: 3 // 特效大小
        },
        lineStyle: {
          normal: { // 正常情况下的线条样式
            color: color[0],
            width: 0, // 因为是叠加效果，要是有宽度，线条会变粗，白色航线特效不明显
            curveness: -0.2 // 线条曲度
          }
        },
        data: this.geos // 特效的起始、终点位置
      }, { // 小飞机航线效果
        type: 'lines',
        zlevel: 2,
        //symbol: ['none', 'arrow'],   // 用于设置箭头
        symbolSize: 10,
        effect: {
          show: true,
          period: 6,
          trailLength: 0,
          symbol: planePath, // 特效形状，可以用其他svg pathdata路径代替
          symbolSize: 5
        },
        lineStyle: {
          normal: {
            color: color[0],
            width: 1,
            opacity: 0.6,
            curveness: -0.2
          }
        },
        data: this.geos // 特效的起始、终点位置，一个二维数组，相当于coords: convertData(item[1])
      }, { // 散点效果
        type: 'effectScatter',
        coordinateSystem: 'geo', // 表示使用的坐标系为地理坐标系
        zlevel: 3,
        rippleEffect: {
          brushType: 'stroke' // 波纹绘制效果
        },
        label: {
          normal: { // 默认的文本标签显示样式
            show: true,
            position: 'left', // 标签显示的位置
            formatter: '{b}' // 标签内容格式器
          }
        },
        itemStyle: {
          normal: {
            color: color[0]
          }
        },
        data: this.geos.map(function (dataItem) {
          return {
            // name: dataItem[1].name,
            value: dataItem, // 起点的位置
            symbolSize: 17, // 散点的大小，通过之前设置的权重来计算，val的值来自data返回的value
          };
        })
      });
      // 显示终点位置,类似于上面最后一个效果，放在外面写，是为了防止被循环执行多次
      series.push({
        type: 'effectScatter',
        coordinateSystem: 'geo',
        zlevel: 3,
        rippleEffect: {
          brushType: 'stroke'
        },
        label: {
          normal: {
            show: true,
            position: 'left',
            formatter: '{b}'
          }
        },
        symbolSize: function (val) {
          return val[2] / 8;
        },
        itemStyle: {
          normal: {
            color: color[1]
          }
        },
        data: [{
          name: '中国',
          value: [116.46, 39.92, 30],
          label: {
            normal: {
              position: 'right'
            }
          }
        }]
      });

      myChart.setOption({
        backgroundColor: '#101724',
        title: {
          //text: '中国国际贸易促进委员会',
          //subtext: '国别资讯',
          textStyle: {
            color: '#fff',
            fontSize: 20
          },
          top: '10px',
          left: '10px'
        },
        geo: {
          map: 'world', // 与引用进来的地图js名字一致
          roam: false, // 禁止缩放平移
          itemStyle: { // 每个区域的样式
            normal: {
              areaColor: '#7d7d7d'
            },
            emphasis: {
              areaColor: '#2a333d'
            }
          },
          regions: [{ // 选中的区域
            name: 'China',
            selected: false,
            itemStyle: { // 高亮时候的样式
              emphasis: {
                areaColor: '#7d7d7d'
              }
            },
            label: { // 高亮的时候不显示标签
              emphasis: {
                show: false
              }
            }
          }]
        },
        series: series, // 将之前处理的数据放到这里
        textStyle: {
          fontSize: 12
        }
      })
    }
  }
}
</script>

<style scoped>
.chart {
  height: 400px;
}
</style>

