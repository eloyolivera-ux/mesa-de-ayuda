/*---------------------------------------------------------------------------
  diagnostico.js
  Herramienta para averiguar por que el login falla en una PC y en otra no.

  Copiar este archivo a la carpeta MesaAyuda (al lado de index.js) y correr:
      node diagnostico.js correo@dominio.com contraseña
  Ejemplo:
      node diagnostico.js sebastian01@gmail.com lola

  NO modifica nada en la base: solo lee. No imprime las keys ni las
  contraseñas guardadas. El resultado se puede copiar y compartir.
---------------------------------------------------------------------------*/
import AWS from 'aws-sdk';
import accessKeyId from '../accessKeyId.js';
import secretAccessKey from '../secretAccessKey.js';

const correo = process.argv[2];
const passwordTipeada = process.argv[3];

if (!correo || passwordTipeada === undefined) {
	console.log('Uso: node diagnostico.js correo@dominio.com contraseña');
	process.exit(1);
}

/*-- Misma configuracion que usa index.js */
AWS.config.update({
	region: 'us-east-1',
	endpoint: 'http://dynamodb.us-east-1.amazonaws.com',
	accessKeyId,
	secretAccessKey,
});

const huella = (k) => (String(k).length > 8 ? String(k).slice(0, 4) + '...' + String(k).slice(-4) : '(muy corta)');

console.log('================ DIAGNOSTICO ================');
console.log('Node version        : ' + process.version);
console.log('Hora de esta PC     : ' + new Date().toISOString() + '  (UTC)');
console.log('Huella accessKeyId  : ' + huella(accessKeyId) + '   <- comparar entre PCs');
console.log('Huella secretKey    : ' + huella(secretAccessKey) + '   <- comparar entre PCs');
console.log('Correo probado      : [' + correo + ']  (largo ' + correo.length + ')');
console.log('Password tipeada    : largo ' + passwordTipeada.length);
console.log('---------------------------------------------');

const db = new AWS.DynamoDB.DocumentClient();

async function scanTodo(tabla) {
	let items = [];
	let lastKey;
	let fechaAWS = null;
	do {
		const req = db.scan({ TableName: tabla, ExclusiveStartKey: lastKey });
		if (req.on) {
			req.on('httpHeaders', (status, headers) => {
				if (headers && headers.date) fechaAWS = headers.date;
			});
		}
		const r = await req.promise();
		items = items.concat(r.Items);
		lastKey = r.LastEvaluatedKey;
	} while (lastKey);
	return { items, fechaAWS };
}

try {
	const { items: clientes, fechaAWS } = await scanTodo('cliente');

	if (fechaAWS) {
		const diff = Math.round((new Date() - new Date(fechaAWS)) / 1000);
		console.log('Hora segun AWS      : ' + new Date(fechaAWS).toISOString());
		console.log('Diferencia de reloj : ' + diff + ' segundos ' + (Math.abs(diff) > 300 ? '  <-- PROBLEMA: mas de 5 min, AWS puede rechazar los pedidos' : '(ok)'));
	}

	console.log('Conexion con AWS    : OK');
	console.log('Clientes en la tabla: ' + clientes.length);

	const coincidencias = clientes.filter((c) => c.contacto === correo);
	console.log('Con contacto igual a [' + correo + ']: ' + coincidencias.length);

	if (coincidencias.length == 0) {
		const parecidos = clientes.filter((c) => typeof c.contacto === 'string' && c.contacto.trim().toLowerCase() === correo.trim().toLowerCase());
		if (parecidos.length > 0) {
			console.log('  >> Hay clientes con un correo PARECIDO (mayusculas o espacios distintos):');
			parecidos.forEach((c) => console.log('     [' + c.contacto + ']'));
		}
		console.log('Correos existentes en la tabla:');
		clientes.forEach((c) => console.log('   - ' + (c.contacto === undefined ? '(sin campo contacto, id=' + c.id + ')' : c.contacto)));
		console.log('\nCONCLUSION: ese correo NO existe en la base que consulta esta PC -> el servidor responde "Cliente invalido".');
	} else {
		coincidencias.forEach((c, i) => {
			const guardada = c.password;
			console.log('--- Cliente #' + (i + 1) + ' ---');
			console.log('id                  : ' + c.id);
			console.log('activo              : ' + String(c.activo) + '  (tipo ' + typeof c.activo + ')' + (c.activo === true ? '' : '   <-- el login exige activo === true'));
			console.log('password guardada   : tipo ' + typeof guardada + ', largo ' + String(guardada).length);
			console.log('  tiene espacios en los bordes: ' + (typeof guardada === 'string' && guardada !== guardada.trim()));
			console.log('  coincide con la tipeada (===): ' + (guardada === passwordTipeada));
			console.log('  coincide con la tipeada (==) : ' + (guardada == passwordTipeada));
		});
		if (coincidencias.length > 1) {
			console.log('\nATENCION: hay ' + coincidencias.length + ' clientes con el mismo correo. El login usa el primero que devuelve DynamoDB.');
		}
		const c = coincidencias[0];
		if (c.activo !== true) console.log('\nCONCLUSION: el cliente esta inactivo -> "Cliente inactivo".');
		else if (c.password !== passwordTipeada) console.log('\nCONCLUSION: la password guardada NO coincide con la tipeada -> "usuario incorrecto".');
		else console.log('\nCONCLUSION: los datos son correctos; el login deberia dar OK. Si igual falla, el problema esta en el servidor o el navegador.');
	}
} catch (err) {
	console.log('Conexion con AWS    : FALLO');
	console.log('Error               : ' + err.code + ' - ' + err.message);
	console.log('\nCONCLUSION: el servidor no puede consultar la base (keys, region, reloj o internet).');
}
console.log('=============================================');
