/* eslint-disable @typescript-eslint/no-explicit-any */
import { Container, Service } from 'typedi'
import { JsonRpcCall, JsonRpcResponse, UtxoBasedRpcSuiteEstimateFee } from '../../../dto'
import { Utils } from '../../../util'
// Need to import like this to keep browser working
import { LoadBalancer } from '../generic'
import { AbstractUtxoRpcEstimateFee } from './AbstractUtxoRpcEstimateFee'

@Service({
  factory: (data: { id: string }) => {
    return new UtxoLoadBalancerRpcEstimateFee(data.id)
  },
  transient: true,
})
export class UtxoLoadBalancerRpcEstimateFee
  extends AbstractUtxoRpcEstimateFee
  implements UtxoBasedRpcSuiteEstimateFee
{
  protected readonly loadBalancer: LoadBalancer

  constructor(id: string) {
    super()
    this.loadBalancer = Container.of(id).get(LoadBalancer)
  }

  protected async rpcCall<T>(method: string, params?: unknown[]): Promise<T> {
    const preparedCall = Utils.prepareRpcCall(method, params)
    return (await this.loadBalancer.rawRpcCall(preparedCall)) as T
  }

  async rawRpcCall(body: JsonRpcCall): Promise<JsonRpcResponse<any>> {
    return this.loadBalancer.rawRpcCall(body)
  }

  rawBatchRpcCall(body: JsonRpcCall[]): Promise<JsonRpcResponse<any>[] | JsonRpcResponse<any>> {
    return this.loadBalancer.rawBatchRpcCall(body)
  }

  public destroy() {
    this.loadBalancer.destroy()
  }

  getRpcNodeUrl(): string {
    return this.loadBalancer.getActiveNormalUrlWithFallback().url
  }
}
