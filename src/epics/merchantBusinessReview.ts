/**
 * Copyright: Copyright (C) 2018 sitb.software,All Rights Reserved
 * author: yangyao(873241789@qq.com)
 * date: 2018/11/9
 */
import { ofType } from 'redux-observable';
import { switchMap, tap } from 'rxjs/operators';

import { execute } from '../core/Request';
import { merchantBusinessReview as types } from '../constants/ActionTypes';
import URL from '../constants/URL';
import { urlArgs } from '@sitb/wbs/utils/HttpUtil';
import actionToast from '../core/actionToast';
import { merge, of } from 'rxjs/index';
import { mergeMap } from 'rxjs/internal/operators';
import { getState } from '../core/store';

/**
 * query 正在审核
 * @param action$
 * @returns {any}
 */
export function startQueryWait(action$) {
  return action$.pipe(
    ofType(types.startQueryWait),
    switchMap(({payload}) => execute({
        url: `${URL.merchant}/business/reviews?${urlArgs({...payload, sort: 'id,desc'})}`,
        type: types.queryWaitComplete
      })
    ));
}

/**
 * query 审核完毕、失败
 * @param action$
 * @returns {any}
 */
export function startQueryOk(action$) {
  return action$.pipe(
    ofType(types.startQueryOk),
    switchMap(({payload}) => execute({
        url: `${URL.merchant}/business/reviews?${urlArgs({...payload, sort: 'id,desc'})}`,
        type: types.queryOkComplete
      })
    ));
}

/**
 * 审核
 * @param action$
 * @returns {any}
 */
export function startCheckReview(action$) {
  return action$.pipe(
    ofType(types.startCheckReview),
    switchMap(({payload}) => execute({
      url: `${URL.merchant}/business/reviews`,
      method: 'POST',
      body: JSON.stringify(payload)
    })),
    tap(actionToast({prefix: 'merchantBusinessReviews'})),
    mergeMap((payload: any) => {
      const {success} = payload;
      const result = [of({
        ...payload,
        type: types.checkReviewComplete
      })];
      // 成功发起query请求
      if (success) {
        // 待审核
        let waitSearchParams = getState().merchantBusinessReview.waitSearchParams;
        // 成功、失败
        let okSearchParams = getState().merchantBusinessReview.okSearchParams;
        result.push(of({
          type: types.startQueryWait,
          payload: {...waitSearchParams}
        }, {
          type: types.startQueryOk,
          payload: {...okSearchParams}
        }));
      }
      return merge(...result);
    }))
}
