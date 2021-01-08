// ==UserScript==
// @name         AllChaptersPDFGenerator
// @description  A script to group all chapters in one PDF file from manganelo or mangakakalot
// @copyright    Kalish, 2020
// @namespace    http://tampermonkey.net/
// @version      1.0
// @license      MIT
// @author       Kalish
// @match        https://manganelo.com/manga/*
// @match        https://mangakakalot.com/read*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    $('body').append('<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.4/jspdf.min.js"></script>');
    var proxyurl = "https://cors-anywhere.herokuapp.com/";

    function gerar_pdf(imagens) {
        let pdf;
        imagens.forEach((imagem, i) => {
            if(i==0) {
                pdf = new jsPDF("p", "px", [imagem.width, imagem.height]);
            }
            else {
                pdf.addPage([imagem.width, imagem.height]);
                pdf.setPage(i+1);
            }
            pdf.addImage(imagem, 0, 0, imagem.width, imagem.height);
        });
        pdf.save($("#pdf_download_name").val());
    }

    async function carregar_imagens(images_arr) {
        let promises_arr = [], image_arr = [], loaded_images = 0;
        for (let image_u of images_arr) {
            promises_arr.push(new Promise((resolve, reject) => {
                let imagem = new Image();
                imagem.src = proxyurl+image_u.src;
                imagem.crossOrigin = "*"
                imagem.onload = () => {
                    loaded_images++;
                    $("#download_info_chap").html('Downloading '+Math.floor((loaded_images/images_arr.length)*100)+'%');
                    $("#total_download_info").html(loaded_images+' of '+images_arr.length+' images downloaded');
                    resolve();
                };
                image_arr.push(imagem);
                imagem.onerror = () => {$("#download_final_result").html("<font color='red'>Too many download requests. Try another time or host your own cors-anywhere server</font>")}
            }));
        }
        await Promise.all(promises_arr).then(() => $("#download_final_result").html("<font color='green'>Generating PDF</font>"));
        return image_arr;
    }

    async function load_all_chapters(classe, imgclasse) {
        let all_chapters_images = [[]], promises_arr = [];
        $($(classe).get().reverse()).each((i,v) => {
            if(i >= $("#fp_download").val() && i <= $("#lp_download").val()) {
                promises_arr.push(new Promise(resolve => {
                    fetch($(v).attr('href')).then(response => response.text()).then(html => {
                        all_chapters_images.push([]);
                        let imagens = new DOMParser().parseFromString(html, "text/html").querySelectorAll(imgclasse);
                        imagens.forEach((img,n,arr) => {
                            all_chapters_images[i].push(img);
                            if(n==arr.length-1) resolve();
                        });
                    });
                }));
            }
        });
        await Promise.all(promises_arr);
        let all_images = Array.prototype.concat(...all_chapters_images)
        $("#download_info_chap").html('Preparing to download '+all_images.length+' images');
        console.log(all_chapters_images);
        console.log(all_images);
        return all_images;
    }



    async function start_download_chapters(classe, imgclasse) {
        const todas_imagens = await load_all_chapters(classe, imgclasse);
        const imagens_carregadas = await carregar_imagens(todas_imagens);
        return imagens_carregadas;
    }

    if(window.location.href.match(new RegExp(/manganelo\.com\//gi))) {
        $('.panel-story-info').append(`
<div align="center" class="panel-story-chapter-list">
<p>
From <select name="first_page_download" id="fp_download" style="background-color:#903;color:#fff;width:40%;font-size:20px;border-radius:3px;border-width:0;"></select>
To <select name="last_page_download" id="lp_download" style="background-color:#903;color:#fff;width:40%;font-size:20px;border-radius:3px;border-width:0;"></select>
</p>
<p style="margin-top:4px;">PDF Title <input type="text" id="pdf_download_name" value="${$('.story-info-right h1').text()}.pdf" style="background-color:#903;color:#fff;width:70%;font-size:20px;border-radius:3px;border-width:0;"/></p>
<span class="style-btn btn-chapterlist" id="download_all_chapters" style="background-color:#ff530d;">DOWNLOAD CHAPTERS</span>
<p id="download_info_chap"></p>
<p id="total_download_info"></p>
<p id="download_final_result"></p>
</div>
`);

        $($('.row-content-chapter li a').get().reverse()).each((i,v) => {
            $("#fp_download").append($("<option></option>").attr("value", i).text($(v).text()));
        });
        $('.row-content-chapter li a').each((i,v) => {
            $("#lp_download").append($("<option></option>").attr("value", $('.row-content-chapter li a').length-i-1).text($(v).text()));
        });
        $('#download_all_chapters').click(() => {start_download_chapters('.row-content-chapter li a', '.container-chapter-reader > img').then(imagens => gerar_pdf(imagens))});

    }
    else if(window.location.href.match(new RegExp(/mangakakalot\.com\//gi))) {
        $('.manga-info-top').append(`
<div align="center" class="manga-info-chapter">
<p>
From <select name="first_page_download" id="fp_download" style="background-color:#903;color:#fff;width:40%;font-size:20px;border-radius:3px;border-width:0;"></select>
To <select name="last_page_download" id="lp_download" style="background-color:#903;color:#fff;width:40%;font-size:20px;border-radius:3px;border-width:0;"></select>
</p>
<p style="margin-top:4px;">PDF Title <input type="text" id="pdf_download_name" value="${$('.manga-info-text li h1').text()}.pdf" style="background-color:#903;color:#fff;width:70%;font-size:20px;border-radius:3px;border-width:0;"/></p>
<span class="btn_chapterslist" id="download_all_chapters" style="background-color:#ff530d;border:0;width:100%;color:white;text-align:center;">DOWNLOAD CHAPTERS</span>
<p id="download_info_chap"></p>
<p id="total_download_info"></p>
<p id="download_final_result"></p>
</div>
`);

        $($('.chapter-list div span a').get().reverse()).each((i,v) => {
            $("#fp_download").append($("<option></option>").attr("value", i).text($(v).text()));
        });
        $('.chapter-list div span a').each((i,v) => {
            $("#lp_download").append($("<option></option>").attr("value", $('.chapter-list div span a').length-i-1).text($(v).text()));
        });
        $('#download_all_chapters').click(() => {start_download_chapters('.chapter-list div span a', '#vungdoc > img').then(imagens => gerar_pdf(imagens))});
    }
})();