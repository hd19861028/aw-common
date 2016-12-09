var qs = require('querystring');
var fs = require('fs');
var q = Promise;
var common = require('./index');
var http = require('http');
var url = require('url');

exports = module.exports;

function getOptions(requrl, params, method, headers) {
	var parsedUrl = url.parse(requrl, true);
	var options = {
		host: null,
		port: -1,
		path: null
	};
	options.host = parsedUrl.hostname;
	options.port = parsedUrl.port;
	options.path = parsedUrl.pathname;
	options.method = method;
	options.timeout = 20000;

	if(params) {
		options.headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Transfer-Encoding': 'chunked'
		}
	}

	if(headers) {
		options.headers = options.headers || {};
		for(key in headers) {
			options.headers[key] = headers[key];
		}
	}

	if(parsedUrl.search) options.path += parsedUrl.search;

	return options;
}

function _send(requrl, data, method, headers, is_res, retry) {
	var d = q.defer();
	var params = '';
	if(data) {
		if(data.constructor.name == "String") {
			params = data;
		}
		if(data.constructor.name == "Object") {
			params = qs.stringify(data);
		}
	}

	var options = getOptions(requrl, params, method, headers);
	var timeoutEventId;

	var req = http.request(options, function(res) {
		res.setEncoding('utf8');
		if(is_res == true) {
			d.resolve(res);
		} else {
			var result = '';
			res.on('data', function(chunk) {
				result += chunk;
			});
			res.on('end', function() {
				if(timeoutEventId) clearTimeout(timeoutEventId);
				d.resolve(result);
			});
			res.on('error', function(err) {
				d.reject(err);
			});
		}
	});

	if(options.timeout) {
		timeoutEventId = setTimeout(function() {
			req.emit('error', 10001);
		}, options.timeout)
	}

	if(params) {
		req.write(params);
	}

	req.on('error', function(err) {
		if(timeoutEventId) clearTimeout(timeoutEventId);
		if(err == 10001) {
			req.res && req.res.abort();
			req.abort();
			err = new Error('连接超时');
			err.code = 10001;
			d.reject(err);
		} else {
			d.reject(err);
		}
	});
	req.end();
	return d.promise;
}

function _sendRetry(requrl, data, method, headers, is_res) {
	if(is_res == true) {
		return _send(requrl, data, method, headers, is_res);
	} else {
		var retry = 0;
		var d = q.defer();
		var sender = function() {
			_send(requrl, data, method, headers, is_res)
				.then(function(r) {
					d.resolve(r);
				}, function(e) {
					retry += 1;
					if(e.code == 10001) {
						if(retry == 3) {
							d.reject(e);
						} else {
							sender();
						}
					} else {
						retry = 3;
						sender();
					}
				});
		}
		sender();
		return d.promise;
	}
}

/**
 * @param {String} requrl
 * @param {Object|String} data
 * 		如果data是json，例如{a:1,b:2}，则将其转换成a=1&b=2
 * 		如果data是string，则不转换，直接发送
 * @param {Object}	headers	自定义请求头
 * @param {Boolean} is_res	是否直接返回响应流
 * @return {Promise}	返回的内容
 */
exports.Post = function(requrl, data, headers, is_res) {
	return _sendRetry(requrl, data, 'post', headers, is_res)
}

/**
 * @param {String} requrl
 * @param {Object|String} data
 * 		如果data是json，例如{a:1,b:2}，则将其转换成a=1&b=2
 * 		如果data是string，则不转换，直接发送
 * @param {Object}	headers	自定义请求头
 * @param {Boolean} is_res	是否直接返回响应流
 * @return {Promise}	返回的内容
 */
exports.Put = function(requrl, data, headers, is_res) {
	return _sendRetry(requrl, data, 'put', headers, is_res)
}

/**
 * @param {String} requrl
 * @param {Object}	headers	自定义请求头
 * @param {Boolean} is_res	是否直接返回响应流
 * @return {Promise}	返回的内容
 */
exports.Get = function(requrl, headers, is_res) {
	return _sendRetry(requrl, null, 'get', headers, is_res)
}

/**
 * @param {String} requrl
 * @param {Object}	headers	自定义请求头
 * @param {Boolean} is_res	是否直接返回响应流
 * @return {Promise}	返回的内容
 */
exports.Delete = function(requrl, headers, is_res) {
	return _sendRetry(requrl, null, 'delete', headers, is_res)
}

/**
 * @param {String} requrl	网络文件路径
 * @param {String} saveurl	本地文件路径
 * @return {Promise}		true|false
 */
exports.Download = function(requrl, saveurl) {
	var d = q.defer();
	var options = getOptions(requrl, null, 'get');
	var req = http.request(options, function(res) {
		var writer = fs.createWriteStream(saveurl)
		res.pipe(writer)
		res.on('error', function() {
			d.resolve(false);
		})
		res.on('end', function() {
			d.resolve(true);
		});
	});
	req.on('error', function(err) {
		d.resolve(false);
	});
	req.end();
	return d.promise;
}