/**
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

import * as intents from "../../src/intents/index.js";

const intent: intents.Intent = "create";
const definition: intents.IntentDefinition = intents.getIntentDefinition(intent);
const indexedDefinition: intents.IntentDefinition = intents.intentDefinitions[intent];

/**
 * @ts-expect-error Unknown product intents are rejected. */
intents.getIntentDefinition("unknown");

/**
 * @ts-expect-error actionCatalog was replaced by intentDefinitions. */
const removedActionCatalog = intents.actionCatalog;

/**
 * @ts-expect-error getActionCatalogEntry was replaced by getIntentDefinition. */
const removedGetActionCatalogEntry = intents.getActionCatalogEntry;

/**
 * @ts-expect-error ActionCatalogEntry was replaced by IntentDefinition. */
const removedActionCatalogEntry: intents.ActionCatalogEntry | undefined = undefined;

/**
 * @ts-expect-error ActionIntent was replaced by Intent. */
const removedActionIntent: intents.ActionIntent | undefined = undefined;

void [
  definition,
  indexedDefinition,
  removedActionCatalog,
  removedGetActionCatalogEntry,
  removedActionCatalogEntry,
  removedActionIntent,
];
