import { CetusClmmSDK, TickMath } from "@cetusprotocol/cetus-sui-clmm-sdk"
import { testnetConnection, JsonRpcProvider, SUI_DECIMALS } from "@mysten/sui.js";
import {BN} from 'bn.js';

const provider = new JsonRpcProvider(testnetConnection);

const SDKConfig = {
  clmmConfig: {
    pools_id: '0xc090b101978bd6370def2666b7a31d7d07704f84e833e108a969eda86150e8cf',
    global_config_id: '0x6f4149091a5aea0e818e7243a13adcfb403842d670b9a2089de058512620687a',
    global_vault_id: '0xf3114a74d54cbe56b3e68f9306661c043ede8c6615f0351b0c3a93ce895e1699',
    admin_cap_id: '0xa456f86a53fc31e1243f065738ff1fc93f5a62cc080ff894a0fb3747556a799b',
  },
  cetusConfig: {
    coin_list_id: '0x257eb2ba592a5480bba0a97d05338fab17cc3283f8df6998a0e12e4ab9b84478',
    launchpad_pools_id: '0xdc3a7bd66a6dcff73c77c866e87d73826e446e9171f34e1c1b656377314f94da',
    clmm_pools_id: '0x26c85500f5dd2983bf35123918a144de24e18936d0b234ef2b49fbb2d3d6307d',
    admin_cap_id: '0x1a496f6c67668eb2c27c99e07e1d61754715c1acf86dac45020c886ac601edb8',
    global_config_id: '0xe1f3db327e75f7ec30585fa52241edf66f7e359ef550b533f89aa1528dd1be52',
    coin_list_handle: '0x3204350fc603609c91675e07b8f9ac0999b9607d83845086321fca7f469de235',
    launchpad_pools_handle: '0xae67ff87c34aceea4d28107f9c6c62e297a111e9f8e70b9abbc2f4c9f5ec20fd',
    clmm_pools_handle: '0xd28736923703342b4752f5ed8c2f2a5c0cb2336c30e1fed42b387234ce8408ec',
  },
}

export const clmmTestnet = {
  fullRpcUrl: 'https://fullnode.testnet.sui.io',
  swapCountUrl: 'https://api-sui.devcetus.com/v2/sui/swap/count',
  simulationAccount: {
    address: ''
  },
  faucet: {
    package_id: '0x26b3bc67befc214058ca78ea9a2690298d731a2d4309485ec3d40198063c4abc',
    published_at: '0x26b3bc67befc214058ca78ea9a2690298d731a2d4309485ec3d40198063c4abc',
  },
  cetus_config: {
    package_id: '0xf5ff7d5ba73b581bca6b4b9fa0049cd320360abd154b809f8700a8fd3cfaf7ca',
    published_at: '0xf5ff7d5ba73b581bca6b4b9fa0049cd320360abd154b809f8700a8fd3cfaf7ca',
    config: SDKConfig.cetusConfig,
  },
  clmm_pool: {
    package_id: '0x0868b71c0cba55bf0faf6c40df8c179c67a4d0ba0e79965b68b3d72d7dfbf666',
    published_at: '0x1c29d658882c40eeb39a8bb8fe58f71a216a918acb3e3eb3b47d24efd07257f2',
    config: SDKConfig.clmmConfig,
  },
  integrate: {
    package_id: '0x8627c5cdcd8b63bc3daa09a6ab7ed81a829a90cafce6003ae13372d611fbb1a9',
    published_at: '0xc831ec758f8ddcb23781a4288a9f2ccaf3e17cf7443e8888cf74fd7c80e1f52d'
  },
  deepbook: {
    package_id: '0x000000000000000000000000000000000000000000000000000000000000dee9',
    published_at: '0x000000000000000000000000000000000000000000000000000000000000dee9'
  },
  deepbook_endpoint_v2: {
    package_id: '0xa34ffca2c6540e1ca9e53963ab43e7b1eed7b82e37696c743bb7c6179c15dfa6',
    published_at: '0xa34ffca2c6540e1ca9e53963ab43e7b1eed7b82e37696c743bb7c6179c15dfa6'
  },
  aggregatorUrl: 'https://api-sui.devcetus.com/router'
}

export const TestnetSDK = new CetusClmmSDK(clmmTestnet)

const suiCoinType = "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI";

/**
 * 取得 cetus SUI幣能兌換的下拉選單陣列
 */
export async function getCetusCoinTypeSelectArray() {

  const resp = await fetch('https://api-sui.devcetus.com/v2/sui/pools_info', { method: 'GET' })
  const poolsInfo = await resp.json()

  // cetus SUI幣能兌換的下拉選單陣列
  const cetusCoinTypeSelectArray = new Array();

  // 防止重複的 coin type
  const repeatArray = new Array();

  if (poolsInfo.code === 200) {
    console.log(poolsInfo.data.lp_list);
    for (const pool of poolsInfo.data.lp_list) {
      if (pool.is_closed) {
        continue
      }
      if (pool.coin_a.balance == "0" || pool.coin_b.balance == "0"){
        continue
      }
      // console.log(pool);
      let pool_address = pool.address;
      let coinTypeB = pool.coin_b.address;
      let symbol = pool.coin_a.symbol;

      if (coinTypeB === suiCoinType && !repeatArray.includes(symbol)) {
        repeatArray.push(symbol);
        let obj = new Object();
        obj.symbol = symbol;
        obj.cetusPoolAddress = pool_address;
        obj.suiCoinBalance = pool.coin_b.balance;
        obj.otherCoinBalance = pool.coin_a.balance;
        cetusCoinTypeSelectArray.push(obj);
      }
    }
  }

  return cetusCoinTypeSelectArray;
}

/**
 * 取得Pool詳情
 */
export async function getPoolDetail(cetusPoolAddress){
  const poolDetail = await TestnetSDK.Pool.getPool(cetusPoolAddress);
  return poolDetail;
}

/**
 * 取得估算的數量
 */
export async function getPreSwap(cetusPoolAddress, isBuy, amount) {

  const poolDetail = await getPoolDetail(cetusPoolAddress);

  let from = isBuy? poolDetail.coinTypeB : poolDetail.coinTypeA;
  let to = isBuy? poolDetail.coinTypeA : poolDetail.coinTypeB;
  let byAmountIn = true;
  let priceSplitPoint = 0;
  let partner = '';
  let swapWithMultiPoolParams = undefined;
  let orderSplit = true;
  let externalRouter = false;

  let input_decimals;
  let output_decimals;
  let output_symbol;

  let coinMetaData = await provider.getCoinMetadata({coinType: poolDetail.coinTypeA});
  if (isBuy){
    input_decimals = SUI_DECIMALS;
    output_decimals = coinMetaData.decimals;
    output_symbol = coinMetaData.symbol;
  } else {
    input_decimals = coinMetaData.decimals;
    output_decimals = SUI_DECIMALS;
    output_symbol = "SUI";
  }

  let input_amount = Number(amount) * Number(10 ** input_decimals);

  const res = await TestnetSDK.RouterV2.getBestRouter(
    from, to, input_amount, byAmountIn, priceSplitPoint, partner, swapWithMultiPoolParams, orderSplit, externalRouter);

  let outputAmount = Number(res.result.outputAmount) / Number(10 ** output_decimals) + " " + output_symbol;
  return outputAmount;
}

export function sqrtPriceX64ToPrice(cetusPool, decimalsA, decimalsB) {
  return TickMath.sqrtPriceX64ToPrice(new BN(cetusPool.current_sqrt_price), decimalsA, decimalsB);
}