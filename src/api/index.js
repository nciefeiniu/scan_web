import request from '@/utils/request'

export function indexData(scan_id) {
  return request({
    url: '/api/index/',
    method: 'get',
  })
}
