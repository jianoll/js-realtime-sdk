import uuid from 'uuid/v4';
import { ensureArray } from '../utils';


/**
 * 消息状态枚举
 * @enum {Symbol}
 * @since 3.2.0
 * @memberof module:leancloud-realtime
 */
const MessageStatus = {
  /** 初始状态、未知状态 */
  NONE: Symbol('none'),
  /** 正在发送 */
  SENDING: Symbol('sending'),
  /** 已发送 */
  SENT: Symbol('sent'),
  /** 已送达 */
  DELIVERED: Symbol('delivered'),
  /** 发送失败 */
  FAILED: Symbol('failed'),
};
Object.freeze(MessageStatus);

const rMessageStatus = {
  [MessageStatus.NONE]: true,
  [MessageStatus.SENDING]: true,
  [MessageStatus.SENT]: true,
  [MessageStatus.DELIVERED]: true,
  [MessageStatus.READ]: true,
  [MessageStatus.FAILED]: true,
};

export { MessageStatus };
export default class Message {
  /**
   * @implements AVMessage
   * @param  {Object|String|ArrayBuffer} content 消息内容
   */
  constructor(content) {
    Object.assign(this, { content }, {
      /**
       * @type {String}
       * @memberof Message#
       */
      id: uuid(),
      /**
       * 消息所在的 conversation id
       * @memberof Message#
       * @type {String?}
       */
      cid: null,
      /**
       * 消息发送时间
       * @memberof Message#
       * @type {Date}
       */
      timestamp: new Date(),
      /**
       * 消息发送者
       * @memberof Message#
       * @type {String}
       */
      from: undefined,
      /**
       * @var deliveredAt {?Date} 消息送达时间
       * @memberof Message#
       */
      // deliveredAt,
      /**
       * 消息提及的用户
       * @since 4.0.0
       * @memberof Message#
       * @type {String[]}
       */
      mentionList: [],
      /**
       * 消息是否提及了所有人
       * @since 4.0.0
       * @memberof Message#
       * @type {Boolean}
       */
      mentionedAll: false,
      _mentioned: false,
    });
    this._setStatus(MessageStatus.NONE);
  }

  /**
   * 将当前消息序列化为 JSON 对象
   * @protected
   * @return {Object}
   */
  toJSON() {
    return this.content;
  }

  /**
   * 消息状态，值为 {@link module:leancloud-realtime.MessageStatus} 之一
   * @type {Symbol}
   * @readonly
   * @since 3.2.0
   */
  get status() {
    return this._status;
  }

  _setStatus(status) {
    if (!rMessageStatus[status]) {
      throw new Error('Invalid message status');
    }
    this._status = status;
  }

  /**
   * 消息修改或撤回时间，可以通过比较其与消息的 timestamp 是否相等判断消息是否被修改过或撤回过。
   * @type {Date}
   * @since 3.5.0
   */
  get updatedAt() {
    return this._updatedAt || this.timestamp;
  }
  set updatedAt(value) {
    this._updatedAt = value;
  }

  /**
   * 当前用户是否在该消息中被提及
   * @type {Boolean}
   * @readonly
   * @since 4.0.0
   */
  get mentioned() {
    return this._mentioned;
  }
  _updateMentioned(client) {
    this._mentioned =
      this.from !== client &&
      (this.mentionedAll || this.mentionList.indexOf(client) > -1);
  }
  /**
   * 获取提及用户列表
   * @since 4.0.0
   * @return {String[]} 提及用户的 id 列表
   */
  getMentionList() {
    return this.mentionList;
  }
  /**
   * 设置提及用户列表
   * @since 4.0.0
   * @param {String[]} clients 提及用户的 id 列表
   * @return {Message} self
   */
  setMentionList(clients) {
    this.mentionList = ensureArray(clients);
    return this;
  }
  /**
   * 设置是否提及所有人
   * @since 4.0.0
   * @param {Boolean} [value=true]
   * @return {Messaeg} self
   */
  mentionAll(value = true) {
    this.mentionedAll = Boolean(value);
    return this;
  }

  /**
   * 判断给定的内容是否是有效的 Message，
   * 该方法始终返回 true
   * @protected
   * @returns {Boolean}
   * @implements AVMessage.validate
   */
  static validate() {
    return true;
  }

  /**
   * 解析处理消息内容
   * <pre>
   * 如果子类提供了 message，返回该 message
   * 如果没有提供，将 json 作为 content 实例化一个 Message
   * @protected
   * @param  {Object}  json    json 格式的消息内容
   * @param  {Message} message 子类提供的 message
   * @return {Message}
   * @implements AVMessage.parse
   */
  static parse(json, message) {
    return message || new this(json);
  }
}
