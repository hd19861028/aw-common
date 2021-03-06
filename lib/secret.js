var crypto = require("crypto");
var buf = require("buffer");

/**
 * @param {String} key 加密密钥，默认取global.config.ase_key字段的值
 * @param {String} method	加密方式，默认为sha1
 */
function Secret(key, method) {
	this.key = key ? key : global.config.ase_key;
	this.method = method ? method : 'sha1';
}

/**
 * @param {String} str	需要加密的字符串
 * @param {String} method	加密方式，md5 || sha1
 * @return {String}	返回密文
 */
Secret.prototype.Encrypt = function(str, method) {
	if(!method) method = this.method;
	var Buffer = buf.Buffer;
//	var buff = new Buffer(str);
//	var bytes = buff.toString("binary");
	var c = crypto.createHash(method);
	c.update(str);
	return c.digest("hex");
}

Secret.prototype.HmacSha1 = function(key, str) {
	var c = crypto.createHmac('sha1', key);
	c.update(str);
	return c.digest().toString('base64');
}

/**
 * cookie签名
 * 
 * @param {String} str	需要签名的字段
 * @param {String} key		用于签名的密钥，可空，默认为Secret类型的默认密钥
 * @return {String}	返回经过签名的字符串
 */
Secret.prototype.Sign = function(str, key) {
	if(!key) key = this.key;

	return str + '.' + crypto
		.createHmac('sha256', key)
		.update(str)
		.digest('base64')
		.replace(/\=+$/, '');
}

/**
 * @param {String} str	加密的字段
 * @param {String} key		用于签名的密钥，可空，默认为Secret类型的默认密钥
 * @return {String}	返回加密后的密码串
 */
Secret.prototype.ASE_Encrypt = function(str, key) {
	if(!key) key = this.key;
	var cipher = crypto.createCipher('aes-128-ecb', key);
	return cipher.update(str, 'utf8', 'hex') + cipher.final('hex');
}

/**
 * @param {String} str	解密的字段
 * @param {String} key		用于签名的密钥，可空，默认为Secret类型的默认密钥
 * @return {String}	返回解密后的字符串
 */
Secret.prototype.ASE_Decrypt = function(str, key) {
	if(!key) key = this.key;
	var cipher = crypto.createDecipher('aes-128-ecb', key);
	return cipher.update(str, 'hex', 'utf8') + cipher.final('utf8');
}

/**
 * @param {String} str	需要验证签名的字段
 * @param {String} key		用于签名的密钥，可空，默认为Secret类型的默认密钥
 * @return {Boolean}		true：表示当前的str签名是有效的，反之，则无效
 */
Secret.prototype.Unsign = function(str, key) {
	if(!key) key = this.key;

	var temp = str.slice(0, str.lastIndexOf('.')),
		mac = this.Sign(temp, key);

	return mac == str ? temp : false;
}

/**
 * @param {Object} key				公钥
 * @param {Object} secretKey	私钥
 * @param {Object} ts				时间戳，单位：秒，有效期30秒
 * @return {String}	sha1(公钥+私钥+时间戳)
 */
Secret.CreateSign = function(key, secretKey, ts) {
	var str = key + secretKey + ts;
	var sign = sec.Encrypt(str);
	return sign;
}

/**
 * @param {Object} key				公钥
 * @param {Object} secretKey	私钥
 * @param {Object} ts				时间戳，单位：秒，有效期30秒
 * @param {Object} signOrigin	待验证的签名串
 * @return {Number}
 * 		1: 		验证通过
 * 		0: 		签名不正确
 * 		-1: 	时间戳超时30秒，过期
 */
Secret.ValidSign = function(key, secretKey, ts, signOrigin) {
	var sign = CreateSign(key, secretKey, ts);
	var now = ~~(Date.now() / 1000);

	if(now - ts > 30) {
		return -1;
	}
	if(sign == signOrigin) {
		return 1;
	} else {
		return 0;
	}
}

exports = module.exports = Secret;