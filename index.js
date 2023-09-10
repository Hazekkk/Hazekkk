const readline = require('readline');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const interactionInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function isValidUrl(url) {
    const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
    return urlPattern.test(url);
}

async function videoDownload() {
    try {
        interactionInterface.question('Cole o link do vídeo do Pinterest: ', async (urlVideo) => {
            try {
                if (!isValidUrl(urlVideo)) {
                    console.error('A URL fornecida não é válida.');
                    videoDownload();
                    return;
                }

                const response = await axios.get(urlVideo);
                const html = response.data;
                const videoUrl = getVideoUrlFromHtml(html);

                const urlTitle = path.parse(urlVideo).name;
                const sanitizedTitle = urlTitle.replace(/[^\w\d]+/g, '_');

                if (videoUrl) {
                    const format = 'mp4';

                    let fileName = `${sanitizedTitle}.${format}`;
                    const folderPath = './src/videos/';
                    let filePath = path.join(folderPath, fileName);
                    const resultPath = folderPath + fileName;

                    if (!fs.existsSync(folderPath)) {
                        fs.mkdirSync(folderPath, { recursive: true });
                    }

                    let counter = 1;
                    while (fs.existsSync(filePath)) {
                        fileName = `${sanitizedTitle}(${counter}).${format}`;
                        filePath = path.join(folderPath, fileName);
                        counter++;
                    }

                    const codecVideo = 'copy';
                    const codecAudio = 'copy';

                    const ffmpegCommand = `ffmpeg -i ${videoUrl} -c:v ${codecVideo} -c:a ${codecAudio} ${filePath}`;

                    exec(ffmpegCommand, (error) => {
                        if (error) {
                            console.error('Erro ao baixar o vídeo:', error.message);
                            interactionInterface.close();
                        } else {
                            console.log(`Sucesso! Video baixado em ${resultPath}`);
                            interactionInterface.question('Deseja fazer o download de outro vídeo? (s/n): ', (answer) => {
                                if (answer.toLowerCase() === 's') {
                                    videoDownload();
                                } else {
                                    console.log('Adeus!');
                                    interactionInterface.close();
                                }
                            });
                        }
                    });
                } else {
                    console.error('Nenhum vídeo encontrado na página.');
                    interactionInterface.close();
                }
            } catch (error) {
                console.error('Ocorreu um erro ao processar a solicitação:', error.message);
                interactionInterface.close();
            }
        });
    } catch (error) {
        console.error('Ocorreu um erro ao iniciar o programa:', error.message);
        interactionInterface.close();
    }
}

function getVideoUrlFromHtml(html) {
    const match = html.match(/<video.*?src=["'](.*?)["']/i);
    return match ? match[1] : null;
}

videoDownload();