var path = require('path');

module.exports.timestampFilename = (filename) => {
	var extension = path.extname(filename);
	var nameWithoutExt = filename.split('.').slice(0, -1).join('.');
	var newFileName = `${nameWithoutExt}_${Date.now()}${extension}`;
	return newFileName;
};
module.exports.extractFileInfoFromBase64 = (base64String) => {
	const dataRes = {
		mimeType: '',
		fileExtension: '',
		data: '',
		isFile: true
	}
	const matches = base64String.match(/^data:(.*?);base64,(.*)$/);

	if (!matches || matches.length !== 3) {
		dataRes.isFile = false;
		return dataRes
	}

	const mimeType = matches[1];
	const data = matches[2];

	const fileExtension = mimeType.split('/')[1];
	dataRes.mimeType = mimeType;
	dataRes.fileExtension = fileExtension;
	dataRes.data = data;
	return dataRes;
}
