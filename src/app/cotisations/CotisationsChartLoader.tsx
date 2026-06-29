import { getChartData } from './actions'
import CotisationsChart from './CotisationsChart'

export default async function CotisationsChartLoader() {
  const data = await getChartData()
  return <CotisationsChart data={data} />
}
