import { Component } from './';
import datetime from '../../utils/datetime';

const messageLogger = new Component('messageLogger', [{
  rules: [/.*/],
  handler ({ senderId, senderName, msg, isMaster, config }) {
    if (!config.logMessage || !msg) return;
    console.log(`[Arknights][${datetime()}]${isMaster ? '*' : ''} ${senderName}(${senderId}): ${msg}`);
  },
}]);

export default messageLogger;
