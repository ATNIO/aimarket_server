/**
 * Created by zhubg on 2017/9/26.
 */

'use strict';

import {rdsEnd,rdsConnection} from '../../util/database';

export default async function postInterceptor(data) {
    //断开连接
    // await rdsEnd(rdsConnection);
    return data;
}