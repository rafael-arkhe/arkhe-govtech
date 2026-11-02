import { randomUUID, timingSafeEqual } from 'node:crypto';
const endpoints = new Set(['health','ready','metrics','login','logout','me','govtech']);
const buckets = [.01,.05,.1,.5,1,5,10,30];
const observations = new Map();
export function operationRoute(segments) { const value = segments.join('/'); return endpoints.has(value) ? value : endpoints.has(segments[0]) ? segments[0] : 'other'; }
export function metricsAuthorized(request) {
  const secret = process.env.GOVTECH_METRICS_TOKEN;
  if (!secret || secret.length < 32) return false;
  const actual = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual,expected);
}
export function observeRequest({ route, method, status, duration }, write = line => process.stdout.write(line+'\n')) {
  const verb = ['GET','POST','PUT'].includes(method) ? method : 'OTHER';
  const code = Number.isInteger(status) && status >= 100 && status <= 599 ? status : 500;
  const seconds = Math.max(0,Number.isFinite(duration) ? duration : 0);
  const key = JSON.stringify([route,verb,Math.floor(code/100)+'xx']);
  const row = observations.get(key) || {route,method:verb,statusClass:Math.floor(code/100)+'xx',count:0,sum:0,buckets:buckets.map(()=>0)};
  row.count++; row.sum+=seconds; buckets.forEach((bound,i)=>{if(seconds<=bound)row.buckets[i]++;}); observations.set(key,row);
  if (code >= 400 || !['health','ready','metrics'].includes(route)) write(JSON.stringify({timestamp:new Date().toISOString(),level:code>=500?'error':code>=400?'warn':'info',event:'http_request',installation_scope:'single-org',operation_id:randomUUID(),route,method:verb,status:code,duration_ms:Math.round(seconds*100000)/100}));
}
export function prometheusMetrics() {
  const lines = ['# HELP arkhe_http_requests_total API responses in this process.','# TYPE arkhe_http_requests_total counter','# HELP arkhe_http_duration_seconds API handler duration, not response streaming.','# TYPE arkhe_http_duration_seconds histogram'];
  for (const row of observations.values()) {
    const labels=`route=${JSON.stringify(row.route)},method=${JSON.stringify(row.method)},status_class=${JSON.stringify(row.statusClass)}`;
    lines.push(`arkhe_http_requests_total{${labels}} ${row.count}`);
    buckets.forEach((bound,i)=>lines.push(`arkhe_http_duration_seconds_bucket{${labels},le="${bound}"} ${row.buckets[i]}`));
    lines.push(`arkhe_http_duration_seconds_bucket{${labels},le="+Inf"} ${row.count}`,`arkhe_http_duration_seconds_count{${labels}} ${row.count}`,`arkhe_http_duration_seconds_sum{${labels}} ${row.sum}`);
  }
  lines.push('# TYPE arkhe_process_uptime_seconds gauge',`arkhe_process_uptime_seconds ${process.uptime()}`,'# TYPE arkhe_process_resident_memory_bytes gauge',`arkhe_process_resident_memory_bytes ${process.memoryUsage().rss}`);
  return lines.join('\n')+'\n';
}
export const metricsResponse = () => new Response(prometheusMetrics(),{headers:{'Content-Type':'text/plain; version=0.0.4; charset=utf-8','Cache-Control':'no-store'}});
