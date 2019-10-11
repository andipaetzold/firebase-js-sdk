/**
 * @license
 * Copyright 2019 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as persistenceHelpers from './persistence_test_helpers';
import { expect } from 'chai';
import { IndexedDbPersistence } from '../../../src/local/indexeddb_persistence';
import { Persistence } from '../../../src/local/persistence';
import { PersistencePromise } from '../../../src/local/persistence_promise';

let persistence: Persistence;

describe('MemoryTransaction', () => {
  beforeEach(() => {
    return persistenceHelpers.testMemoryEagerPersistence().then(p => {
      persistence = p;
    });
  });

  genericTransactionTests();
});

describe('IndexedDbTransaction', () => {
  if (!IndexedDbPersistence.isAvailable()) {
    console.warn('No IndexedDB. Skipping IndexedDbTransaction tests.');
    return;
  }

  beforeEach(() => {
    return persistenceHelpers.testIndexedDbPersistence().then(p => {
      persistence = p;
    });
  });

  afterEach(() => persistence.shutdown());

  genericTransactionTests();
});

function genericTransactionTests(): void {
  it('invokes onCommittedListener when transaction succeeds', async () => {
    let onCommitted = false;
    await persistence.runTransaction('onCommitted', 'readonly', txn => {
      txn.addOnCommittedListener(() => {
        onCommitted = true;
      });

      expect(onCommitted).to.be.false;
      return PersistencePromise.resolve();
    });

    expect(onCommitted).to.be.true;
  });

  it('does not invoke onCommittedListener when transaction fails', async () => {
    let onCommitted = false;
    await persistence
      .runTransaction('onCommitted', 'readonly', txn => {
        txn.addOnCommittedListener(() => {
          onCommitted = true;
        });

        return PersistencePromise.reject(new Error('Aborted'));
      })
      .catch(() => {});

    expect(onCommitted).to.be.false;
  });
}
