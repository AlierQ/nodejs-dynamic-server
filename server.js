var http = require('http')
var fs = require('fs')
var url = require('url')
const { parse } = require('path')
var port = process.argv[2]

if(!port){
  console.log('请指定端口号，例如：node server.js xxxx')
  process.exit(1)
}

var server = http.createServer(function(request, response){
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url 
  var queryString = ''
  if(pathWithQuery.indexOf('?') >= 0){ queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  /******** 从这里开始看，上面不要看 ************/

  console.log('接收到请求，请求路径为：' + pathWithQuery)
  // 注册
    if(path === '/register' && method === 'POST'){
      response.setHeader('Content-Type','text/html;charset=UTF-8')
      // 获取前端传过来的数据
      const array = [];
      request.on('data',(chunk)=>{
        array.push(chunk);
      }) 
      
      request.on('end',()=>{
        // 转换编码
        const string = Buffer.concat(array).toString();
        let obj = JSON.parse(string)
        // 写入文件
        let fileData = JSON.parse(fs.readFileSync('./db/users.json'));
        // 设置id,拿到最后一个数组元素，如果存在就将其id加1
        // 如果不存在就设置为 1
        obj['id'] = fileData[fileData.length-1] ? fileData[fileData.length-1].id+1 : 1;
        fileData.push(obj);
        fs.writeFileSync('./db/users.json',JSON.stringify(fileData));
        response.end('success')
      })
    // 登录
    } else if(path === '/login' && method === 'POST'){
      // 获取前端传过来的数据
      const array = [];
      request.on('data',(chunk)=>{
        array.push(chunk);
      }) 
      let fileData = JSON.parse(fs.readFileSync('./db/users.json'));
      request.on('end',()=>{
        // 转换编码
        const string = Buffer.concat(array).toString();
        let obj = JSON.parse(string)
        const user = fileData.find((item)=>{
          return obj.name === item.name && obj.password === item.password
        })
        if(user === undefined){
          response.statusCode = 400;
          response.setHeader('Content-Type','text/json;charset=UTF-8')
          response.end(`{"errorCode":4001}`)
        }else{
          response.statusCode = 200;
          // 设置cookie
          // 登录状态和user_id
          // response.setHeader('Set-Cookie',`user_id=${user.id}; HttpOnly`);
          // session_id
          const random = Math.random();
          response.setHeader('Set-Cookie',`session_id=${random}; HttpOnly`);
          let session = JSON.parse(fs.readFileSync('./session.json').toString())
          // let session = {};
          session[random] = {user_id:user.id}
          fs.writeFileSync('./session.json',JSON.stringify(session));
          response.end('登录成功')
        }
      })
    } 
    else if(path === '/home.html'){
      // 获取前端传过来的数据
      response.setHeader('Content-Type','text/html;charset=UTF-8')
      const cookie = request.headers['cookie'];
      try{
        // 处理cookie，拿到session的cookie
        let cookieArray = cookie.replace(' ','').split(';')
        let string  = cookieArray.filter(item=>{
          return item.split('=')[0] === 'session_id';
        })
        // 获取session文件内容
        let sessionData = JSON.parse(fs.readFileSync('./session.json'))
        // 根据cookie中的session_id的值获取session中对应存储的用户id
        let user_id = sessionData[string[0].split('=')[1]]
        // 获取用户数据
        let fileData = JSON.parse(fs.readFileSync('./db/users.json'));
        // 根据session中用户id的获取name
        let user = fileData.find((item)=>{
          return item.id === user_id["user_id"]
        })
        if(user){
          // 替换名字
          response.write(fs.readFileSync('./public/home.html').toString()
          .replace('{{user.name}}',user.name.toString()) 
          .replace('{{status}}','已登录'))
        }else{
          response.write(fs.readFileSync('./public/home.html').toString()
          .replace('{{user.name}}','')
          .replace('{{status}}','未登录'))
        }

      }catch(error){
        response.write(fs.readFileSync('./public/home.html').toString()
        .replace('{{user.name}}','')
        .replace('{{status}}','未登录'))
      }
      response.end()
    } 
    else{
      // 静态服务器
      response.statusCode = 200
      // 默认首页是index.html
      const filePath = path === '/' ? '/index.html' : path;
      // 获取后缀，设置类型
      const suffix = filePath.substring(filePath.lastIndexOf('.')); 
      const fileType = {
          '.html':'text/html',
          '.css':'text/css',
          '.js':'text/javascript',
          '.json':'text/json',
          '.xml':'text/xml',
          '.png':'image/png',
          '.jpg':'image/jpg',
          '.jpeg':'image/jpeg',
      }
      // 防止错误类型，所有默认没有在哈希中找到的，就设置为html
      response.setHeader('Content-Type', `${fileType[suffix] || 'text/html'};charset=utf-8`)
      
      // 文件不存在的处理
      let content;
      console.log(filePath);
      try{
          content = fs.readFileSync(`public${filePath}`)
      }catch(error){
          content = '文件不存在';
          response.statusCode = 404
      }
      response.write(content)
      response.end()
    }

  /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n 可以通过该地址访问： http://localhost:' + port)