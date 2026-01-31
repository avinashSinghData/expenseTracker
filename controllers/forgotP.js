const uuid = require('uuid');
const Sib = require('sib-api-v3-sdk');
const bcrypt = require('bcryptjs');

const client = Sib.ApiClient.instance
const myApiKey = client.authentications['api-key']
myApiKey.apiKey = process.env.API_KEY
const tranEmailApi = new Sib.TransactionalEmailsApi()
let content = new Sib.SendSmtpEmail()


const myTable = require('../models/userTable')
const forgotPassword = require('../models/forgotPTable');

require('dotenv').config() 





const forgotMyP = async (req, res) => {
    try {
        const { email } =  req.body;
        const user = await myTable.findOne({where : { email }});
        if(user){
            const id = uuid.v4();
            await forgotPassword.create({ id , 
                active: true,
                ourUserId: user.id })

                .catch(err => {
                    throw new Error(err)
                })
    
            content = {
                name: 'Avinash Singh', 
                sender: {email: 'singhavinash9fg@gmail.com'},
                to: [{email: email}],
                subject: 'Forgot password',
                textContent:'Reset your password here',
                htmlContent: `<a href="http://localhost:4000/password/resetpassword/${id}">Reset password</a>`
            }  
           
            await tranEmailApi.sendTransacEmail(content);   
            return res.status(202).json({message: 'Link to reset password sent to your mail ', success: true, id:id})
        } else {
            return res.status(404).json({ message: 'User not found' });
          }
        } catch (error) {
          console.log(error);
          return res.status(500).json({ message: 'Internal server error' });
        }
      }

    

      
      const resetMyP = async (req, res) => {
        const id =  req.params.id;
       
        try{
            forgotPwd = await forgotPassword.findOne({ where : { id }})
            if (forgotPwd){
                if (forgotPwd.dataValues.active){          
                    res.status(201).send(`<html>
                                                        <form action="/password/updatepassword/${id}" method="get">
                                                            <label for="newPassword">Enter New password</label>
                                                            <input name="newPassword" type="password" id="newPassword" required></input>
                                                            <button>Reset password</button>
                                                        </form>
                                                    </html>`
                    )                  
                }
            }else{
                throw new Error('Wrong link')
            }
        }catch(error){
           return res.status(400).json({success:false, error: error.message})
        }
    }
  
    


    const updateMyP = async (req, res) => {
        const id = req.params.id;
        const { newPassword } = req.query;
      
        try {
          const forgotPwd = await forgotPassword.findOne({ where: { id } });
          if (forgotPwd && forgotPwd.dataValues.active) {
            const user = await myTable.findByPk(forgotPwd.ourUserId);
            if (user) {
                const salt = await bcrypt.genSalt(10)
                const hashedPassword = await bcrypt.hash(newPassword, salt)
                    
              await user.update({ password: hashedPassword });
              await forgotPwd.update({ active: false });
              return res.status(200).json({ success: true, message: 'Password updated successfully' });

         } else {
              throw new Error('User not found');
            }
          } else {
            throw new Error('Invalid or expired link');
          }
        } catch (error) {
          return res.status(400).json({ success: false, error: error.message });
        }
      }



module.exports = {
    forgotMyP,
    resetMyP,
    updateMyP
}

