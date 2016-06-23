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

	if (params) {
		options.headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': params.length
		}
	}

	if (headers) {
		options.headers = options.headers || {};
		for (key in headers) {
			options.headers[key] = headers[key];
		}
	}

	if (parsedUrl.search) options.path += parsedUrl.search;

	return options;
}

function _send(requrl, data, method, headers, is_res) {
	var d = q.defer();
	var params = '';
	if (data) {
		if (data.constructor.name == "String") {
			params = data;
		}
		if (data.constructor.name == "Object") {
			params = qs.stringify(data);
		}
	}

	var options = getOptions(requrl, params, method, headers);

	var req = http.request(options, function(res) {
		res.setEncoding('utf8');
		if (is_res == true) {
			d.resolve(res);
		} else {
			res.on('data', function(chunk) {
				d.resolve(chunk);
			});
			res.on('error', function(err) {
				d.reject(err);
			});
		}
	});

	if (params) {
		req.write(params);
	}

	req.on('error', function(err) {
		d.reject(err);
	});
	req.end();
	return d.promise;
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
	return _send(requrl, data, 'post', headers, is_res)
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
	return _send(requrl, data, 'put', headers, is_res)
}

/**
 * @param {String} requrl
 * @param {Object}	headers	自定义请求头
 * @param {Boolean} is_res	是否直接返回响应流
 * @return {Promise}	返回的内容
 */
exports.Get = function(requrl, headers, is_res) {
	return _send(requrl, null, 'get', headers, is_res)
}

/**
 * @param {String} requrl
 * @param {Object}	headers	自定义请求头
 * @param {Boolean} is_res	是否直接返回响应流
 * @return {Promise}	返回的内容
 */
exports.Delete = function(requrl, headers, is_res) {
	return _send(requrl, null, 'delete', headers, is_res)
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