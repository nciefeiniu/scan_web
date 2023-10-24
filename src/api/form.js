import request from '@/utils/request'

export function sendScan(data) {
  return request({
    url: '/api/scan/',
    method: 'post',
    data
  })
}


export function checkScanStatus(scan_id) {
  return request({
    url: '/api/scan_status/',
    method: 'get',
    params: {'scan_id': scan_id}
  })
}
