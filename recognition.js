import * as config from './config';

// Imports the Google Cloud client library
const Speech = require('@google-cloud/speech');

// Your Google Cloud Platform project ID
const projectId = 'example-projects-173015';

// Instantiates a client
const speechClient = Speech({
  projectId: projectId
});

// The audio file's encoding, sample rate in hertz, and BCP-47 language code
const options = {
  encoding: 'FLAC',
  sampleRateHertz: 48000,
  languageCode: 'en-US',
  speechContexts: {
    phrases: [config.activationPhrase.toLowerCase()]
  }
};

// Detects speech in the audio file
export function recognize(fileName) {
  return new Promise((resolve, reject) => {
    speechClient.recognize(fileName, options)
      .then((results) => {
        const transcription = results[0];
        resolve(transcription);
      })
      .catch((err) => {
        reject(err);
      });
  })
}
