/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ContentState
 * @typechecks
 * @flow
 */

'use strict';

const BlockMapBuilder = require('BlockMapBuilder');
const CharacterMetadata = require('CharacterMetadata');
const ContentBlock = require('ContentBlock');
const DraftEntity = require('DraftEntity');
const Immutable = require('immutable');
const SelectionState = require('SelectionState');

const generateRandomKey = require('generateRandomKey');
const sanitizeDraftText = require('sanitizeDraftText');

import type {BlockMap} from 'BlockMap';
import type DraftEntityInstance from 'DraftEntityInstance';
import type {DraftEntityMutability} from 'DraftEntityMutability';
import type {DraftEntityType} from 'DraftEntityType';

const {List, Record, Repeat} = Immutable;

const defaultRecord: {
  entityMap: ?any,
  blockMap: ?BlockMap,
  selectionBefore: ?SelectionState,
  selectionAfter: ?SelectionState,
} = {
  entityMap: null,
  blockMap: null,
  selectionBefore: null,
  selectionAfter: null,
};

const ContentStateRecord = Record(defaultRecord);

class ContentState extends ContentStateRecord {

  getEntityMap(): any {
    // TODO: update this when we fully remove DraftEntity
    return DraftEntity;
  }

  getBlockMap(): BlockMap {
    return this.get('blockMap');
  }

  getSelectionBefore(): SelectionState {
    return this.get('selectionBefore');
  }

  getSelectionAfter(): SelectionState {
    return this.get('selectionAfter');
  }

  getBlockForKey(key: string): ContentBlock {
    var block: ContentBlock = this.getBlockMap().get(key);
    return block;
  }

  getKeyBefore(key: string): ?string {
    return this.getBlockMap()
      .reverse()
      .keySeq()
      .skipUntil(v => v === key)
      .skip(1)
      .first();
  }

  getKeyAfter(key: string): ?string {
    return this.getBlockMap()
      .keySeq()
      .skipUntil(v => v === key)
      .skip(1)
      .first();
  }

  getBlockAfter(key: string): ?ContentBlock {
    return this.getBlockMap()
      .skipUntil((_, k) => k === key)
      .skip(1)
      .first();
  }

  getBlockBefore(key: string): ?ContentBlock {
    return this.getBlockMap()
      .reverse()
      .skipUntil((_, k) => k === key)
      .skip(1)
      .first();
  }

  getBlocksAsArray(): Array<ContentBlock> {
    return this.getBlockMap().toArray();
  }

  getFirstBlock(): ContentBlock {
    return this.getBlockMap().first();
  }

  getLastBlock(): ContentBlock {
    return this.getBlockMap().last();
  }

  getPlainText(delimiter?: string): string {
    return this.getBlockMap()
      .map(block => {
        return block ? block.getText() : '';
      })
      .join(delimiter || '\n');
  }

  getLastCreatedEntityKey() {
    // TODO: update this when we fully remove DraftEntity
    return DraftEntity.__getLastCreatedEntityKey();
  }

  hasText(): boolean {
    var blockMap = this.getBlockMap();
    return (
      blockMap.size > 1 ||
      blockMap.first().getLength() > 0
    );
  }

  createEntity(
    type: DraftEntityType,
    mutability: DraftEntityMutability,
    data?: Object,
  ): ContentState {
    // TODO: update this when we fully remove DraftEntity
    DraftEntity.__create(
      type,
      mutability,
      data,
    );
    return this;
  }

  mergeEntityData(
    key: string,
    toMerge: {[key: string]: any},
  ): ContentState {
    // TODO: update this when we fully remove DraftEntity
    DraftEntity.__mergeData(key, toMerge);
    return this;
  }

  replaceEntityData(
    key: string,
    newData: {[key: string]: any},
  ): ContentState {
    // TODO: update this when we fully remove DraftEntity
    DraftEntity.__replaceData(key, newData);
    return this;
  }

  addEntity(instance: DraftEntityInstance): ContentState {
    // TODO: update this when we fully remove DraftEntity
    DraftEntity.__add(instance);
    return this;
  }

  getEntity(key: string): DraftEntityInstance {
    // TODO: update this when we fully remove DraftEntity
    return DraftEntity.__get(key);
  }

  static createFromBlockArray(
    // TODO: update flow type when we completely deprecate the old entity API
    blocks: Array<ContentBlock> | {contentBlocks: Array<ContentBlock>},
    entityMap: ?any,
  ): ContentState {
    // TODO: remove this when we completely deprecate the old entity API
    const theBlocks = Array.isArray(blocks) ? blocks : blocks.contentBlocks;
    var blockMap = BlockMapBuilder.createFromArray(theBlocks);
    var selectionState = blockMap.isEmpty()
      ? new SelectionState()
      : SelectionState.createEmpty(blockMap.first().getKey());
    return new ContentState({
      blockMap,
      entityMap: entityMap || DraftEntity,
      selectionBefore: selectionState,
      selectionAfter: selectionState,
    });
  }

  static createFromText(
    text: string,
    delimiter: string | RegExp = /\r\n?|\n/g,
  ): ContentState {
    const strings = text.split(delimiter);
    const blocks = strings.map(
      block => {
        block = sanitizeDraftText(block);
        return new ContentBlock({
          key: generateRandomKey(),
          text: block,
          type: 'unstyled',
          characterList: List(Repeat(CharacterMetadata.EMPTY, block.length)),
        });
      },
    );
    return ContentState.createFromBlockArray(blocks);
  }
}

module.exports = ContentState;
