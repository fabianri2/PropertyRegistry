const { Web3 } = require('web3');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const MyContract = require('./build/contracts/PropertyRegistry.json');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const port = 4000;
const web3 = new Web3('http://127.0.0.1:7545');
const contractAddress = '0xbfBB93F80C85Cdf47F96815c48d5383bF3cDf9f5';
const myContractInstance = new web3.eth.Contract(MyContract.abi, contractAddress);

const users = {};
const JWT_SECRET = process.env.JWT_SECRET || '123456789';

app.use(bodyParser.json());

function serializeBigInt(value) {
  return JSON.stringify(value, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
}

// Registrar un nuevo usuario
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (users[username]) return res.status(400).send('El usuario ya existe.');

  const hashedPassword = await bcrypt.hash(password, 10);
  users[username] = { password: hashedPassword };
  res.status(201).send('Usuario registrado exitosamente.');
});

// Iniciar sesión de usuario
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user) return res.status(400).send('Usuario no encontrado.');

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).send('Contraseña inválida.');

  // Generar token JWT
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  res.status(200).json({ token });
});

// Middleware de autenticación
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send('Acceso denegado. No se ha iniciado sesión.');

  const token = authHeader.split(' ')[1];
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send('Token inválido.');
  }
};
// Registrar una nueva propiedad (solo usuarios autenticados)
app.post('/registerProperty', authMiddleware, async (req, res) => {
  const { propertyAddress, ownerName } = req.body;
  const accounts = await web3.eth.getAccounts();
  const owner = accounts[0];

  try {
    const receipt = await myContractInstance.methods.registerProperty(propertyAddress, ownerName).send({
      from: owner,
      gas: 3000000 
    });
    const event = receipt.events.PropertyRegistered;
    const propertyId = event.returnValues.id;
    const serializedReceipt = JSON.stringify(receipt, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
    res.status(201).send(serializeBigInt({ message:'Propiedad registrada exitosamente.', propertyId }));
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Transferir propiedad (solo usuarios autenticados)
app.post('/transferProperty', authMiddleware, async (req, res) => {
  const { propertyId, newOwner, newOwnerName } = req.body;
  const accounts = await web3.eth.getAccounts();
  const currentOwner = accounts[0];

  try {
    const receipt = await myContractInstance.methods.transferOwnership(propertyId, newOwner, newOwnerName).send({
      from: currentOwner,
      gas: 3000000 
    });
    const serializedReceipt = JSON.stringify(receipt, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
    res.status(200).send('Propiedad transferida exitosamente.');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Obtener detalles de una propiedad (solo usuarios autenticados)
app.get('/property/:id', authMiddleware, async (req, res) => {
  const propertyId = req.params.id;

  try {
    const property = await myContractInstance.methods.getProperty(propertyId).call();
    if (property && property.id) {
      const response = {
        id: property.id.toString(), 
        owner: property.owner,
        propertyAddress: property.propertyAddress,
        ownerName: property.ownerName
      };
      res.status(200).send(response);
    } else {
      res.status(404).send('Propiedad no encontrada.');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Obtener todas las propiedades (solo usuarios autenticados)
app.get('/properties', authMiddleware, async (req, res) => {
  try {
    const properties = await myContractInstance.methods.getAllProperties().call();
    const formattedProperties = properties.map(property => {
      if (property && property.id) {
        return {
          id: property.id.toString(), 
          owner: property.owner,
          propertyAddress: property.propertyAddress,
          ownerName: property.ownerName
        };
      }
      return null;
    }).filter(property => property !== null);
    res.status(200).send(formattedProperties);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
