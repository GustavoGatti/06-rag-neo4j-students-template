import { createServer } from './server.ts';
import { config } from './config.ts';

const app = createServer();

let address: string;
try {
    address = await app.listen({ port: config.port, host: '0.0.0.0' });
} catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'EADDRINUSE') {
        throw error;
    }

    console.warn(`Port ${config.port} is already in use; starting on an available port instead.`);
    address = await app.listen({ port: 0, host: '0.0.0.0' });
}
console.log(`Server is running at ${address}`);

//  curl \
//  -X POST \
//  -H 'Content-type: application/json' \
//  --data '{"question": "upper"}' \
//  localhost:4000/chat

app.inject({
    method: 'POST',
    url: '/sales',
    payload: {
        question: 'Qual curso teve a maior taxa de reembolso?', // complex
        // question: "Find courses that students typically purchase after 'Machine Learning em Navegadores'", // complex
        // question: 'Show me the revenue distribution across all courses',
        // question: 'Which users have progressed over 80%?', //simple
        //question: 'Quantos cursos tem na academia?', //simple
    },
}).then(response => {
    console.log(JSON.parse(response.body)?.answer);
}).catch(error => {
    console.error('Error making test request:', error);
})