const express = require('express');
const app = express();

app.set('port', process.env.PORT || 4000);

// Para poder el body json del request
app.use(express.json());

// SDK de PayPal
const paypal = require('@paypal/checkout-server-sdk');

// Agrega credenciales
// se usa SandboxEnvironment. Para producción, usar LiveEnvironment
let environment = new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID || 'AQGTW1u17kVYNNKSbT8Rw5s-dj0cgN9VsvN_Iq4cUYsCvOPFFodPYFvQTg1QdBVWbVM-wllZhTPlBikQ', process.env.PAYPAL_SECRET || 'EO9Agk_ryFYNQCrH0Fi0JIkmVPvItXjjyWDgGxblxBS3HvgAsGmXd3GMws5Ik-eHh0DGDtA81L8Nn0fB');
let client = new paypal.core.PayPalHttpClient(environment);


//1. Crea orden de pago
//2. Devuelve el link de pago
app.get('/payment', async (req, res) => {
  let request = new paypal.orders.OrdersCreateRequest();
  request.requestBody({
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "amount": {
                    "currency_code": "USD",
                    "value": "100.00"
                }
            }
          ],
        "application_context": {
          "return_url": `http://localhost:${process.env.PORT || 4000}/redirect`, //se define la url de regreso si se completó el pago -> 3.
          "cancel_url": `http://localhost:${process.env.PORT || 4000}/cancel` //se define la url de regreso si se quiere cancelar -> 4.
        }
  });
  client.execute(request).then( response => {
    let {links} = response.result;
    console.log(links);
    let url = links.filter(link => link.rel == "approve");
    res.status(response.statusCode).json(url);
  }).catch(err =>{
    console.error(err);
    res.status(err.statusCode).json(err);
  });
});

//3.  Cuando el pago se completa, se obtiene el token para capturar el pago del comprador
app.get('/redirect', async (req, res) => {
  let {token} = req.query;
  request = new paypal.orders.OrdersCaptureRequest(token);
  request.requestBody({});
  client.execute(request).then(response=>{
    console.log(response.result);
    res.status(200).json(response.result);
  }).catch(err => {
    console.error(err);
    res.status(err.statusCode).json(err);
  });
});

//4. Cuando se cancela, se redirige acá
app.get('/cancel',async (req,res) => {
  console.log(`Payment cancelled`);
  res.status(200).json(`Payment cancelled`);
});

app.listen(app.get('port'),'localhost', () => {
  console.log(`Server on port ${app.get('port')}`);
});