import * as speech from './recognition';
const mm = require('musicmetadata');
const SoxCommand = require('sox-audio');
const fs = require('fs');
const path = require('path');
import * as config from './config';

function getChannel(msg){
  return new Promise((resolve, reject) => {
    let [command, ...channelName] = msg.content.split(" ");
    if (!msg.guild) {
      reject('no private service is available in your area at the moment. Please contact a service representative for more details.');
    }
    if(channelName.length < 1){
      if (msg.member.voiceChannel) {
        resolve(msg.member.voiceChannel);
      } else {
        reject('You need to join a voice channel first!');
      }
    }else{
      const voiceChannel = msg.guild.channels.find("name", channelName.join(" "));
      //console.log(voiceChannel.id);
      if (!voiceChannel || voiceChannel.type !== 'voice') {
        reject(`I couldn't find the channel ${channelName}. Can you spell?`);
      }else{
        resolve(voiceChannel)
      }
    }
  })
}

function deleteFile(fileName) {
  fs.unlink(fileName, (err) => {
    if (err) {
      console.log("File Delete Error: " + err);
    }
  });
}

export function join(msg){
  getChannel(msg)
    .then((voiceChannel) => {
      voiceChannel.join()
        .then(conn => {
          msg.reply(`Successfully joined ${voiceChannel}`);
          // create our voice receiver
          const receiver = conn.createReceiver();

          function transposeToFlac(fileName) {
            const length_of_ext = path.extname(fileName).length;
            const newFile = fileName.substring(0, (fileName.length - length_of_ext)) + '.flac';
            let command = SoxCommand();
              command.input(fileName)
                .inputSampleRate(48000)
                .inputEncoding('signed')
                .inputBits(16)
                .inputChannels(2)
                .inputFileType('raw');

              command.output(newFile)
                .outputSampleRate(48000)
                .outputEncoding('signed')
                .outputBits(16)
                .outputChannels(1)
                .outputFileType('flac');

            command.on('end', function () {
              deleteFile(fileName);
              mm(fs.createReadStream(newFile), function (err, metadata) {
                console.log("Track is " + metadata.duration + " seconds long");
                if (parseFloat(metadata.duration) > config.minRecognizeTime) {
                  speech.recognize(newFile)
                    .then((output) => {
                      if (output.length > 0) {
                        console.log("Speech recognized: " + output);
                        if(output.toUpperCase().startsWith(config.activationPhrase.toUpperCase())){
                          command = output.substring(config.activationPhrase.length + 1);
                          handleCommand(command, msg);
                        }else{
                          //msg.channel.send(`Google Heard: ${output}`);
                        }
                      }
                      console.log("unlinking: " + newFile);
                      deleteFile(newFile)
                    })
                    .catch((err) => {
                      console.log("Speech error: " + err);
                      deleteFile(newFile);
                    })
                } else {
                  deleteFile(newFile);
                }
              });
            });
            command.run();
          }

          conn.on('speaking', (user, speaking) => {
            if (speaking) {
              const audioStream = receiver.createPCMStream(user); //16-bit signed PCM, stereo 48KHz
              // create an output stream so we can dump our data in a file
              const fileName = `./recordings/${voiceChannel.id}-${user.id}-${Date.now()}.raw`;
              const outputStream = fs.createWriteStream(fileName);
              // pipe our audio data into the file stream
              audioStream.pipe(outputStream);
              //When the stream stops, the data is then turned into the FLAC format
              audioStream.on('end', () => {
                transposeToFlac(fileName);
              });
            }
          });
        })
        .catch(console.log);
    })
    .catch((err) => {
      msg.reply(err);
    });
}

export function handleCommand(command, msg){
  command = command.toLowerCase();
  msg.reply(`You issued the command: ${command}`);
  if(command === "What is the time"){
    msg.channel.send("Why hello there!")
  }
}

export function leave(msg){
  getChannel(msg)
    .then((voiceChannel) => {
      voiceChannel.leave();
      msg.reply(`Successfully left ${voiceChannel}`);
    })
    .catch((err) => {
      msg.reply(err);
    })
}

export function setPrefix(prefixString){
  return new Promise((resolve, reject) => {
    if(prefixString.length > 1){
      reject("Error: Prefix too long");
    }else{
      config.prefix = prefixString;
      resolve("Prefix set to "+config.prefix);
    }
  });
}

export function setPhrase(phrase){
  return new Promise((resolve, reject) => {
    if(phrase.length > 20){
      reject("Error: Activation Phrase too long");
    }else{
      config.activationPhrase = phrase;
      resolve("Activation Phrase set to "+config.activationPhrase);
    }
  })
}

export function commandList(){
  return([
    config.prefix+"join (Channel) - Tells bot to join a voice channel. If Channel is blank, the bot will join the current channel.",
    config.prefix+"leave (Channel) - Tells bot to leave a voice channel. If Channel is blank, the bot will leave the current channel.",
    config.prefix+"setPhrase (Short Phrase) - Sets the command activation phrase.",
    config.prefix+"setPrefix (One character) - Sets the command prefix.",
  ])
}