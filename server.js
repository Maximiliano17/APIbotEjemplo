const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 4000;

app.use(bodyParser.json());

// Arreglo para almacenar los días disponibles con sus turnos
let diasConTurnos = [];

// Función para generar los turnos disponibles
const generarTurnosDisponibles = () => {
    const horaApertura = 10; // 10:00 AM
    const horaCierre = 19; // 7:00 PM
    const duracionTurno = 40; // Duración de cada turno en minutos

    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    const days = daysUntilFriday === 0 ? 7 : daysUntilFriday + 1; // Añadir 1 para incluir el viernes

    // Reiniciar el contador de IDs para cada día
    let contadorIDs = 1;

    for (let i = 0; i < days; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);

        const turnos = [];
        let hora = horaApertura;

        while (hora < horaCierre) {
            const horaInicio = `${hora}:00`;
            const horaFin = sumarMinutos(horaInicio, duracionTurno);

            const turnoDisponible = esTurnoDisponible(currentDate, horaInicio);

            turnos.push({
                id: contadorIDs,
                inicio: horaInicio,
                fin: horaFin,
                disponible: turnoDisponible,
                cliente: null // Nombre del cliente inicialmente vacío
            });

            hora += 1; // Avanzar al siguiente turno sumando 1 hora
            contadorIDs++; // Incrementar el contador de IDs para cada turno
        }

        const dateStr = currentDate.toISOString().split('T')[0];
        const dayName = getDayName(currentDate.getDay());

        diasConTurnos.push({
            fecha: dateStr,
            diaSemana: dayName,
            turnos: turnos
        });

        // Reiniciar el contador de IDs para el siguiente día
        contadorIDs = 1;
    }

    console.log("Días con turnos generados:", diasConTurnos.map(dia => dia.diaSemana).join(', '));
};

// Función auxiliar para sumar minutos a una hora dada (en formato HH:mm)
const sumarMinutos = (hora, minutos) => {
    let [hours, mins] = hora.split(':');
    hours = parseInt(hours);
    mins = parseInt(mins);

    mins += minutos;
    hours += Math.floor(mins / 60);
    mins %= 60;

    return `${pad(hours)}:${pad(mins)}`;
};

// Función auxiliar para asegurarse de que los números tengan dos dígitos (por ejemplo, "09" en lugar de "9")
const pad = (num) => {
    return (num < 10 ? '0' : '') + num;
};

// Función auxiliar para obtener el nombre del día de la semana en texto
const getDayName = (dayOfWeek) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    return days[dayOfWeek];
};

// Función auxiliar para verificar si un turno es disponible
const esTurnoDisponible = (date, horaInicio) => {
    const now = new Date();
    const turnoDate = new Date(date);
    turnoDate.setHours(parseInt(horaInicio.split(':')[0]));
    turnoDate.setMinutes(parseInt(horaInicio.split(':')[1]));

    return now < turnoDate;
};

// Endpoint para obtener los días disponibles
app.get('/turnos', (req, res) => {
    const diasDisponibles = diasConTurnos.map(dia => dia.diaSemana);
    res.json(diasDisponibles);
});

// Endpoint para obtener los turnos disponibles por día
app.get('/turnos/:dia', (req, res) => {
    const { dia } = req.params;
    const diaBuscado = diasConTurnos.find(d => d.diaSemana.toLowerCase() === dia.toLowerCase());

    if (!diaBuscado) {
        res.status(404).json({ error: `No se encontraron turnos disponibles para ${dia}.` });
    } else {
        res.json(diaBuscado.turnos);
    }
});

// Endpoint para obtener un turno específico por ID dentro de un día
app.get('/turnos/:dia/:id', (req, res) => {
    const { dia, id } = req.params;
    const diaBuscado = diasConTurnos.find(d => d.diaSemana.toLowerCase() === dia.toLowerCase());

    if (!diaBuscado) {
        res.status(404).json({ error: `No se encontraron turnos disponibles para ${dia}.` });
    } else {
        const turno = diaBuscado.turnos.find(t => t.id === parseInt(id));

        if (!turno) {
            res.status(404).json({ error: `No se encontró el turno ${id} para ${dia}.` });
        } else {
            res.json(turno);
        }
    }
});

// Endpoint para asignar el nombre del cliente a un turno específico
app.put('/turnos/:dia/:id', (req, res) => {
    const { dia, id } = req.params;
    const { cliente } = req.body;

    const diaBuscado = diasConTurnos.find(d => d.diaSemana.toLowerCase() === dia.toLowerCase());

    if (!diaBuscado) {
        res.status(404).json({ error: `No se encontraron turnos disponibles para ${dia}.` });
    } else {
        const turno = diaBuscado.turnos.find(t => t.id === parseInt(id));

        if (!turno) {
            res.status(404).json({ error: `No se encontró el turno ${id} para ${dia}.` });
        } else {
            turno.cliente = cliente;
            res.json({ mensaje: `Nombre del cliente '${cliente}' asignado al turno ${id} de ${dia}.` });
        }
    }
});

// Generar los turnos disponibles al iniciar el servidor
generarTurnosDisponibles();

// Iniciar el servidor
app.listen(port, () => {
    console.log(`API escuchando en http://localhost:${port}`);
});