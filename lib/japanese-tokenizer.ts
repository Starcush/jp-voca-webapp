import "server-only";

import { join } from "node:path";
import * as kuromoji from "kuromoji";
import type { IpadicFeatures, Tokenizer } from "kuromoji";

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | undefined;

/**
 * 서버에서 공유하는 일본어 형태소 분석기를 반환합니다.
 *
 * @returns 한 번만 초기화되어 재사용되는 kuromoji 토크나이저입니다.
 */
export function getJapaneseTokenizer() {
  tokenizerPromise ??= new Promise((resolve, reject) => {
    kuromoji
      .builder({
        dicPath: join(process.cwd(), "node_modules/kuromoji/dict"),
      })
      .build((error, tokenizer) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(tokenizer);
      });
  });

  return tokenizerPromise;
}
