/**
 * Created by zhubg on 2017/10/20.
 */

'use strict';
import {Message} from '../../objects';
var crypto = require('crypto');
var rp = require('request-promise');

//web3
const Web3 = require('web3');
const fs = require('fs');
const config = require('../../../util/config/config.json');
import registerAbi from '../../../util/abi/Register';
import xiaoiAbi from '../../../util/abi/xiaoi';
import ATTAbi from '../../../util/abi/ATT';

const {
  endpoint,
  account,
  cost,
  bizAddr,
  proxyAddr,
  billAddr,
  gasLimit,
  attAddr
} = config;

const web3 = new Web3(new Web3.providers.HttpProvider(endpoint));

export async function callAI() {
  try {
    let options;
    let result;
    let app_key;
    let type = "callAI";
    let code = "900001";
    let content = "";
    let params = {};
    params = JSON.parse(arguments[1].params);

    //baidu ORC
    if (params.type === "baiduOcr") {

      var AipOcrClient = require("baidu-aip-sdk").ocr;
      // 设置APPID/AK/SK
      var APP_ID = "10216389";
      var API_KEY = "W9EKSl5xwhEpEI7w5swK1ugb";
      var SECRET_KEY = "Hwfn4bprEiUQqpv4dLUclxWSv6yA7qNd";

      var client = new AipOcrClient(APP_ID, API_KEY, SECRET_KEY);

      let obj = await client.generalUrl(params.url, {detect_direction: true});
      console.log(obj);
      content = JSON.stringify(obj);
      return new Message(type, code, content);

      //baiduVoice
    } else if (params.type === "baiduVoice") {

      var AipSpeechClient = require("baidu-aip-sdk").speech;
      var fs = require('fs');

      // 设置APPID/AK/SK
      var APP_ID1 = "10266139";
      var API_KEY1 = "yZrc3nNz6qC5AwuCUFGem88P";
      var SECRET_KEY1 = "CRnLKOuMUgGXrqMP3AQFIMBMBxg0ZQCO";

      var client1 = new AipSpeechClient(APP_ID1, API_KEY1, SECRET_KEY1);

      var result1 = await client1.text2audio(params.word, {spd: 0, per: 4});
      console.log(result1);
      // await Promise.resolve().then(()=>{
      //   return fs.writeFile('./public/testVoice.mp3', result1.data, (err) => {
      //     if (err) throw err;
      //     console.log('The file has been saved!');
      //   });
      // });

      var flag = await new Promise((resolve, reject) => {
        fs.writeFile('./public/test.mp3', result1.data, (err) => {
          if (err) reject(false);
          resolve(true);
        });
      });

      if(flag){
        return new Message(type, code, JSON.stringify({message:"baiduVoice_success"}));
      }else {
        return new Message(type, code, JSON.stringify({message:"baiduVoice_fail"}));

      }
      //xiao i robot
    } else if (params.type === "xiaoi") {

      // app_key = '0MsaHPtJA8M5';
      // var app_secret = 'auVSuMpW5AY5eJUdGe53';
      // var realm = "xiaoi.com";
      // var method = "POST";
      // var uri = "/ask.do";
      // var nonce = crypto.randomBytes(20).toString('hex');
      // var HA1 = crypto.createHash('sha1').update([app_key, realm, app_secret].join(":")).digest('hex');
      // var HA2 = crypto.createHash('sha1').update([method, uri].join(":")).digest('hex');
      // var sign = crypto.createHash('sha1').update([HA1, nonce, HA2].join(":")).digest('hex');
      // var ret = `app_key=\"${app_key}\",nonce=\"${nonce}\",signature=\"${sign}\"`;
      //
      // options = {
      //   method: 'POST',
      //   url: 'http://nlp.xiaoi.com/ask.do',
      //   headers: {
      //     'cache-control': 'no-cache',
      //     'x-auth': ret
      //   },
      //   form: {
      //     user_id: 'user_id',
      //     question: params.question,
      //     platform: 'custom',
      //     format: 'xml'
      //   }
      // };
      //
      // result = await rp(options).catch(function (err) {
      //   // Crawling failed or Cheerio choked...
      //   return err;
      // });

      const xiaoiContract = web3.eth.contract(xiaoiAbi);
      const ATTContract = web3.eth.contract(ATTAbi);

      const xiaoi = xiaoiContract.at(proxyAddr);
      const att = ATTContract.at(attAddr);
      console.log("xiaoi");
      // console.log(xiaoi.callAI.toString());
      console.log(xiaoi.address);

      // await att.generateTokens(account.address,1000,{from:account.address,gas:gasLimit});
      var a = await att.balanceOf(account.address,{from:account.address,gas:gasLimit});
      console.log(a);
      await att.approve(billAddr, 1000000,{from:account.address,gas:gasLimit});
      var b = await att.allowance(account.address, billAddr, {from:account.address,gas:gasLimit});
      console.log(b);
      // let arg = {method: 'animalDetect', url: 'http://t2.27270.com/uploads/tu/201612/357/7.png'};
      await xiaoi.callAI('xiaoi', JSON.stringify({question:params.question}), {from:account.address,gas:gasLimit});


      var eventNewCallback = xiaoi.newCallback();

      result = await new Promise((resolve, reject) => {
        eventNewCallback.watch(function (error, result) {
          if (!error){
            console.log(result);
            resolve(result);
          }else {
            console.log(error);
            resolve(error);
          }
          eventNewCallback.stopWatching();
        });
      });

      console.log(result);

      return new Message(type, code, JSON.stringify({answer: result.args._result}));

      //aliyun AI Market
    } else if (params.type === "aliface") {

      var request = require("request");

      options = {
        method: 'POST',
        url: 'https://api-cn.faceplusplus.com/facepp/v3/detect',
        headers: {
          'postman-token': '3b9c2397-78b4-798d-3bbb-1eeca61bb2c4',
          'cache-control': 'no-cache',
          'content-type': 'application/x-www-form-urlencoded'
        },
        form: {
          api_key: 'WqiDdteZP4nlAEl_tX0q6K2C4WHUqm1Q',
          api_secret: '3bWrbJux_Kj3A7hArYKpOFU3hzYIIlN9',
          // image_base64: '',
          image_url: params.url,
          // image_file: '',//二进制文件，需要用post multipart/form-data的方式上传
          return_attributes: 'age,smiling,eyestatus,emotion,beauty'
        }
      };

      result = await rp(options).catch(function (err) {
        // Crawling failed or Cheerio choked...
        return err;
      });

      return new Message(type, code, result);

      //xunfei ai
    } else if (params.type === "xunfeiai") {

      var app_id = '59e9b4bb';
      app_key = '1e62889443f14a1998f35799058af5d1';
      var body = new Buffer(params.question).toString('base64');
      var http_body = 'text=' + body;
      var curTime = parseInt(Date.now() / 1000);
      var json = {"userid": "aaa", "scene": "main"};
      var param = new Buffer(JSON.stringify(json)).toString('base64');
      var b = app_key + curTime + param + http_body;
      var checkSum = crypto.createHash('md5').update(b).digest('hex');
      options = {
        method: 'POST',
        url: 'http://api.xfyun.cn/v1/aiui/v1/text_semantic',
        headers: {
          'cache-control': 'no-cache',
          'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
          accept: 'text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2',
          'x-checksum': checkSum,
          'x-appid': app_id,
          'x-param': param,
          'x-curtime': curTime
        },
        form: {text: body}
      };

      result = await rp(options);
      console.log(JSON.parse(result));
      if (JSON.parse(result).data && JSON.parse(result).data.answer && JSON.parse(result).desc === "成功") {
        content = JSON.stringify({answer: JSON.parse(result).data.answer.text});
      } else {
        content = JSON.stringify({error: "ai request fail"});
      }
      console.log();
      return new Message(type, code, content);

    } else {
      return new Message("error", "400004", "Not found " + params.type);
    }

  }
  catch (err) {
    console.log(err);
    return new Message("error", "400001", err);
  }
}