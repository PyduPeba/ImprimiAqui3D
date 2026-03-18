import axios from 'axios';

const haUrl = 'http://192.168.18.240:8123';
const haToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiNWE3NGYzYTg0YzI0YTliODA4NWNkNzZlMzVjYTk4MyIsImlhdCI6MTc3Mzc2MzcwNCwiZXhwIjoyMDg5MTIzNzA0fQ.vso09LvHNcoMgk0udlYitN-WRmarc1wQMQqAUQuvSOc';

async function testButtons() {
    try {
        const response = await axios.get(`${haUrl}/api/states`, {
            headers: {
                Authorization: `Bearer ${haToken}`,
                'Content-Type': 'application/json',
            },
        });
        const states = response.data;
        const buttons = states.filter((s: any) => s.entity_id.startsWith('button.'));
        console.log('Available Buttons:');
        buttons.forEach((b: any) => {
            if (b.entity_id.includes('ad5x') || b.entity_id.includes('centauri') || b.entity_id.includes('elegoo') || b.entity_id.includes('flashforge')) {
                console.log(b.entity_id);
            }
        });
    } catch (e: any) {
        console.error(e.message);
    }
}

testButtons();
