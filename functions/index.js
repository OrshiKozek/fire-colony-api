const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const apiRoutes = require('./api/routes');

const app = express();

const options = { origin: "http://localhost:3000", credentials: true };

var sendMail = function(email, event, eventDate) {
	var transport = nodemailer.createTransport({
	  host: "smtp.mailtrap.io",
	  port: 2525,
	  auth: {
		user: "7603a8d03f4dd2",
	  	pass: "3cbe115878a1f7"
	  }
	});

	const mailOptions = {
        from: 'AnimalColonyService@example.com', //Adding sender's email
        to: email, //Getting recipient's email by query string
      	subject: 'Notice About An Upcoming Event', //Email subject
		text: 'Your event: ' +  event + ' is coming up soon at: ' + eventDate + '.' //Email content in HTML
	}

			  
	const getDeliveryStatus = function (error, info) {
		if (error) {return console.log(error);}
		console.log("Message sent");
	}

	transport.sendMail(mailOptions, getDeliveryStatus);
}

exports.dailyJob = functions.pubsub.schedule('20 17 * * *').onRun(context => {
	const eventRef = db.collection('events');
  	const querySnapshot = eventRef.get();
    if (!querySnapshot.empty) {
    	querySnapshot.forEach(doc => {
      	const data = doc.data();
      	const numberOfKeys = Object.keys(data).length;
      	if(numberOfKeys > 0){
      		var timeDiff = (new Date(data.timestamp).getTime() - new Date()) / (24*60*60*1000)
        	if(timeDiff > 0 && timeDiff <= 7) {
        		for(email in data.users) {
        			console.log("Sending email to " + email);
    				sendMail(email, data.event, data.timestamp);
    			}
        	}
          
        }
      })
    }
});


app.use(cors(options));
app.use(cookieParser());
app.use(bodyParser.json());

const errorMiddleware = require('./api/middleware/errors');

app.use('/api', apiRoutes);
app.use(errorMiddleware);

exports.app = functions.https.onRequest(app);
