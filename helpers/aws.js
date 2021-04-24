const aws=require('aws-sdk');
const multer=require('multer');
const multers3=require('multer-s3');
const key=require('../config/dev');
aws.config.update({
    accessKeyId:key.AWSAccessID,
    secretAccessKey:key.AWSSecretKey,
    region:'us-west-2'
});
const s3=new aws.S3({});
const upload=multer({
    storage:multers3({
        s3:s3,
        bucket:'carrentalapp6459',
        acl:'public-read',
        metadata:(req,file,cb)=>{
            cb(null,{fieldName:file.fieldname});
        },
        key:(req,file,cb)=>{
            cb(null,file.originalname);
        },
        rename:(fieldName,fileName)=>{
            return fileName.replace(/\W+/g,'-').toLowerCase();
        }
    })
});
exports.upload=upload;
