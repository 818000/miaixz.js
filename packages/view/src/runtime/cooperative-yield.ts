/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

/**
 * Provides sparse event-loop yield points for large synchronous parser loops.
 *
 * This threshold avoids adding task scheduling overhead to ordinary small documents.
 */
export const heavyParserSourceThresholdBytes = 4 * 1024 * 1024;
const heavyParserYieldInterval = 4096;

/**
 * Reports whether a large parser should yield after the current record.
 *
 * @param sourceBytes - Size of the parser's bounded source.
 * @param processed - Number of records processed so far.
 * @returns Whether to yield to cancellation and deadline tasks.
 */
export function shouldYieldParser(sourceBytes: number, processed: number): boolean {
  return (
    sourceBytes >= heavyParserSourceThresholdBytes &&
    processed > 0 &&
    processed % heavyParserYieldInterval === 0
  );
}

/**
 * Yields one task turn, then propagates session cancellation.
 *
 * @param signal - Controller-owned parsing signal.
 */
export async function yieldParserTask(signal: AbortSignal): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  signal.throwIfAborted();
}
