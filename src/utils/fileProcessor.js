const getFileJSON = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(JSON.parse(reader.result));
});

const fileProcessor = async (fileList) => {
    Promise.all(
        fileList.map(async file => {
            let sss = await getFileJSON(file.originFileObj);
            console.log('yooolo: ', sss);
        })
    );
}

export default fileProcessor;
