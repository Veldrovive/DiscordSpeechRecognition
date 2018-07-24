const Discord = require("discord.js");

import * as commands from './commands';
import * as config from './config';

const client = new Discord.Client();
console.log("Starting");

client.on('message', msg => {
  if(msg.content.startsWith(config.prefix+'join')) {
    commands.join(msg);
  }
  if(msg.content.startsWith(config.prefix+'leave')) {
    commands.leave(msg)
  }
  if(msg.content.startsWith(config.prefix+'setPrefix')) {
    commands.setPrefix(msg.content.substring(11))
      .then((res) => {
        msg.reply(res);
      })
      .catch((err) => {
        msg.reply(err);
      });
  }
  if(msg.content.startsWith(config.prefix+'setPhrase')) {
    commands.setPhrase(msg.content.substring(11))
      .then((res) => {
        msg.reply(res);
      })
      .catch((err) => {
        msg.reply(err);
      });
  }
  if(msg.content.startsWith(config.prefix+'help')){
    msg.reply(commands.commandList());
  }
});

client.on('ready', () => {
  console.log('Ready!');
});

client.login(CLIENT_LOGIN)
  .then((res) => {
    console.log("Login res: ",res);
  })
  .catch((err) => {
    console.log(`Login err: `,err);
  });
