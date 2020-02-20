$('#image').on('change', function () {
    showImage(this);
});

function showImage(input){
    if(input.files && input.files[0]){
        let infoArea = document.getElementById('imageLabel');
        let fileName = input.files[0].name;
        infoArea.textContent = 'File name: ' + fileName;

        let reader = new FileReader();
        reader.onload = function(e){
            $('.img-thumbnail').attr('src', e.target.result);
        }
        reader.readAsDataURL(input.files[0]);
    }
}