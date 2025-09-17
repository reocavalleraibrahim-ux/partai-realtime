const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

async function getAntrian(id){
  try{
    const connection = await mysql.createConnection({
      host:'localhost',
      user:'root',
      password:'',
      database:'antrian'
    });

    const [rows] = await connection.execute('SELECT * FROM list WHERE id =  ? LIMIT 1',[id]);

    await connection.end();

    if(rows.length > 0){
      return rows[0];
    }else{
      return null;
    }
  }catch(error){
    throw error;
  }
}

async function updateAntrian(id,data){
  try{
    const connection = await mysql.createConnection({
      host:'localhost',
      user:'root',
      password:'',
      database:'antrian'
    });

  const fields = Object.keys(data);
  const values = Object.values(data);

  if (fields.length === 0){
    throw new Error('No Data Updated');
  }

  const setClause = fields.map(field   => `${field} = ?`).join(', ');
  values.push(id);
  const sql = `UPDATE list SET ${setClause} WHERE id = ?`;

  const [result] = await connection.execute(sql,values);

  await connection.end();

  return result.affectedRows > 0;

}catch(error){
  throw error;
}
}

app.use(express.static(path.join(__dirname,'public')));
app.get('/panel',(req,res) => {
  res.sendFile(path.join(__dirname,'public','panel.html'));
});
app.get('/', (req,res) => {
  res.sendFile(path.join(__dirname,'public','index.html'));
});

let classA = 'kyorugi';
let classB = 'kyorugi';

io.on('connection', (socket) => {

    getAntrian(1).then(
        (record) => {
          if(record){
            var isian = {kelas : record.kelas, partai: record.partai};
            io.emit('ReceiveLapA', isian);
            console.log(isian);
          }
        }
      ).catch(err=> {
        console.log('Error : '+err);
    });

    getAntrian(2).then(
        (record) => {
          if(record){
            var isian = {kelas : record.kelas, partai: record.partai};
            io.emit('ReceiveLapB', isian);
            console.log(isian);
          }
        }
      ).catch(err=> {
        console.log('Error : '+err);
    });

    socket.on('lapA',(val) => {
      updateAntrian(1,{kelas : val.jenis, partai : val.partai});
      console.log('Kelas Lapangan A Berganti Jadi '+ val.jenis);
      classA = val.jenis;

      getAntrian(1).then(
        (record) => {
          if(record){
            var isian = {kelas : record.kelas, partai: record.partai};
            io.emit('ReceiveLapA', isian);
          }
        }
      ).catch(err=> {
        console.log('Error : '+err);
    });
    });
    
    socket.on('lapB',(val) => {
      updateAntrian(2,{kelas : val.jenis, partai : val.partai});
      console.log('Kelas Lapangan B Berganti Jadi '+ val.jenis);
      classB = val.jenis;

      getAntrian(2).then(
        (record) => {
          if(record){
            var isian = {kelas : record.kelas, partai: record.partai};
            io.emit('ReceiveLapB', isian);
          }
        }
      ).catch(err=> {
        console.log('Error : '+err);
    });
    });
    
    socket.on('disconnect', ()=>{
      console.log('Client Disconnected',socket.id);
    })
  });

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});