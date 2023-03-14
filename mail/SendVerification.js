const nodemailer = require("nodemailer");
// transporter for sending mails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "contact.smashingpages@gmail.com",
    pass: "jpnbrycaylyllvdm",
  },
});

// send verification Mail
const SendVerificationMail = async (data) => {
  const email = data.email;
  const id = data.id;
  const token = data.token;
  const route = data.route;
  const message = data.message;
  const subject = data.subject;
  if (!email) {
    return {
      error: "email is required",
    };
  }

  const confirmUrl = `https://smashingpages-616e5.web.app${route}?_id=${id}&token=${token}`;
  const html = `
  <html>
  <body>
  <div style='    min-height: 300px!important;
  display: inline-block!important;
  text-align:center;'>
  <h1 style='color:#5445ff'>Your verification link</h1>
  <p>user ${email} Please click this button to ${message}, remember this link will expiresIn 5 minuts</p>
     <a style="  min-width: max-content;
     height:auto;
     padding: 15px 20px;
     position: relative;
     background-color: #7165ff;
     color: #fff;
     font-size: 16px;
     letter-spacing: 2px;
     transition: background-color 0.2s ease;
     border: none;
     border-radius: 5px;
     text-align:center;
     margin-top: 20px;
     margin-bottom: 20px;
     text-decoration:none;
     outline: none;" href="${confirmUrl}">Verify</a>
  </div>
  </body>
  </html>
  `;
  const mailOptions = {
    from: "contact.smashingpages@gmail.com", // sender address
    to: email, // list of receivers
    subject: subject, // Subject line
    html: html, // plain text body
  };
  transporter.sendMail(mailOptions, (err, info) => {
    console.log(info);
    if (err) {
      console.log(err);
      return {
        error: "email address you entered is invalid or doesn't exist",
      };
    }
  });
};

module.exports = SendVerificationMail;
