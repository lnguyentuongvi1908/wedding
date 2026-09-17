import { video } from './video.js';
import { image } from './image.js';
import { audio } from './audio.js';
import { progress } from './progress.js';
import { util } from '../../common/util.js';
import { bs } from '../../libs/bootstrap.js';
import { loader } from '../../libs/loader.js';
import { theme } from '../../common/theme.js';
import { lang } from '../../common/language.js';
import { storage } from '../../common/storage.js';
import { session } from '../../common/session.js';
import { offline } from '../../common/offline.js';
import { comment } from '../components/comment.js';
import * as confetti from '../../libs/confetti.js';
import { pool } from '../../connection/request.js';

export const guest = (() => {

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let information = null;

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let config = null;

    /**
     * @returns {void}
     */
    const countDownDate = () => {
        const count = (new Date(document.body.getAttribute('data-time').replace(' ', 'T'))).getTime();

        /**
         * @param {number} num 
         * @returns {string}
         */
        const pad = (num) => num < 10 ? `0${num}` : `${num}`;

        const day = document.getElementById('day');
        const hour = document.getElementById('hour');
        const minute = document.getElementById('minute');
        const second = document.getElementById('second');

        const updateCountdown = () => {
            const distance = Math.abs(count - Date.now());

            day.textContent = pad(Math.floor(distance / (1000 * 60 * 60 * 24)));
            hour.textContent = pad(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
            minute.textContent = pad(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)));
            second.textContent = pad(Math.floor((distance % (1000 * 60)) / 1000));

            util.timeOut(updateCountdown, 1000 - (Date.now() % 1000));
        };

        util.timeOut(updateCountdown);
    };

    /**
     * @returns {void}
     */
    const showGuestName = () => {
        /**
         * Make sure "to=" is the last query string.
         * Ex. ulems.my.id/?id=some-uuid-here&to=name
         */
        const raw = window.location.search.split('to=');
        let name = null;

        if (raw.length > 1 && raw[1].length >= 1) {
            name = window.decodeURIComponent(raw[1]);
        }

        if (name) {
            const guestName = document.getElementById('guest-name');
            const div = document.createElement('div');
            div.classList.add('m-2');

            const template = `<small class="mt-0 mb-1 mx-0 p-0">${util.escapeHtml(guestName?.getAttribute('data-message'))}</small><p class="m-0 p-0" style="font-size: 1.25rem">${util.escapeHtml(name)}</p>`;
            util.safeInnerHTML(div, template);

            guestName?.appendChild(div);
        }

        const form = document.getElementById('form-name');
        if (form) {
            form.value = information.get('name') ?? name;
        }
    };

    /**
     * @returns {Promise<void>}
     */
    const slide = async () => {
        const interval = 6000;
        const slides = document.querySelectorAll('.slide-desktop');

        if (!slides || slides.length === 0) {
            return;
        }

        const desktopEl = document.getElementById('root')?.querySelector('.d-sm-block');
        if (!desktopEl) {
            return;
        }

        desktopEl.dispatchEvent(new Event('undangan.slide.stop'));

        if (window.getComputedStyle(desktopEl).display === 'none') {
            return;
        }

        if (slides.length === 1) {
            await util.changeOpacity(slides[0], true);
            return;
        }

        let index = 0;
        for (const [i, s] of slides.entries()) {
            if (i === index) {
                s.classList.add('slide-desktop-active');
                await util.changeOpacity(s, true);
                break;
            }
        }

        let run = true;
        const nextSlide = async () => {
            await util.changeOpacity(slides[index], false);
            slides[index].classList.remove('slide-desktop-active');

            index = (index + 1) % slides.length;

            if (run) {
                slides[index].classList.add('slide-desktop-active');
                await util.changeOpacity(slides[index], true);
            }

            return run;
        };

        desktopEl.addEventListener('undangan.slide.stop', () => {
            run = false;
        });

        const loop = async () => {
            if (await nextSlide()) {
                util.timeOut(loop, interval);
            }
        };

        util.timeOut(loop, interval);
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {void}
     */
    const open = (button) => {
        button.disabled = true;
        document.body.scrollIntoView({ behavior: 'instant' });
        document.getElementById('root').classList.remove('opacity-0');

        if (theme.isAutoMode()) {
            document.getElementById('button-theme').classList.remove('d-none');
        }

        slide();
        theme.spyTop();

        confetti.basicAnimation();
        util.timeOut(confetti.openAnimation, 1500);

        document.dispatchEvent(new Event('undangan.open'));
        util.changeOpacity(document.getElementById('welcome'), false).then((el) => el.remove());
    };

    /**
     * @param {HTMLImageElement} img
     * @returns {void}
     */
    const modal = (img) => {
        document.getElementById('button-modal-click').setAttribute('href', img.src);
        document.getElementById('button-modal-download').setAttribute('data-src', img.src);

        const i = document.getElementById('show-modal-image');
        i.src = img.src;
        i.width = img.width;
        i.height = img.height;
        bs.modal('modal-image').show();
    };

    /**
     * @returns {void}
     */
    const modalImageClick = () => {
        document.getElementById('show-modal-image').addEventListener('click', (e) => {
            const abs = e.currentTarget.parentNode.querySelector('.position-absolute');

            abs.classList.contains('d-none')
                ? abs.classList.replace('d-none', 'd-flex')
                : abs.classList.replace('d-flex', 'd-none');
        });
    };

    /**
     * @param {HTMLDivElement} div 
     * @returns {void}
     */
    const showStory = (div) => {
        if (navigator.vibrate) {
            navigator.vibrate(500);
        }

        confetti.tapTapAnimation(div, 100);
        util.changeOpacity(div, false).then((e) => e.remove());
    };

    /**
     * @returns {void}
     */
    const closeInformation = () => information.set('info', true);

    /**
     * @returns {void}
     */
    const normalizeArabicFont = () => {
        document.querySelectorAll('.font-arabic').forEach((el) => {
            el.innerHTML = String(el.innerHTML).normalize('NFC');
        });
    };

    /**
     * @returns {void}
     */
    const animateSvg = () => {
        document.querySelectorAll('svg').forEach((el) => {
            if (el.hasAttribute('data-class')) {
                util.timeOut(() => el.classList.add(el.getAttribute('data-class')), parseInt(el.getAttribute('data-time')));
            }
        });
    };

    /**
     * @returns {void}
     */
    const buildGoogleCalendar = () => {
        /**
         * @param {string} d 
         * @returns {string}
         */
        const formatDate = (d) => (new Date(d.replace(' ', 'T') + ':00Z')).toISOString().replace(/[-:]/g, '').split('.').shift();

        const url = new URL('https://calendar.google.com/calendar/render');
        const data = new URLSearchParams({
            action: 'TEMPLATE',
            text: 'The Wedding of Wahyu and Riski',
            dates: `${formatDate('2023-03-15 10:00')}/${formatDate('2023-03-15 11:00')}`,
            details: 'Tanpa mengurangi rasa hormat, kami mengundang Anda untuk berkenan menghadiri acara pernikahan kami. Terima kasih atas perhatian dan doa restu Anda, yang menjadi kebahagiaan serta kehormatan besar bagi kami.',
            location: 'RT 10 RW 02, Desa Pajerukan, Kec. Kalibagor, Kab. Banyumas, Jawa Tengah 53191.',
            ctz: config.get('tz'),
        });

        url.search = data.toString();
        document.querySelector('#home button')?.addEventListener('click', () => window.open(url, '_blank'));
    };

    /**
     * @returns {object}
     */
    const loaderLibs = () => {
        progress.add();

        /**
         * @param {{aos: boolean, confetti: boolean}} opt
         * @returns {void}
         */
        const load = (opt) => {
            loader(opt)
                .then(() => progress.complete('libs'))
                .catch(() => progress.invalid('libs'));
        };

        return {
            load,
        };
    };

    /**
     * @returns {Promise<void>}
     */
    const booting = async () => {
        animateSvg();
        countDownDate();
        showGuestName();
        modalImageClick();
        normalizeArabicFont();
        buildGoogleCalendar();

        if (information.has('presence')) {
            document.getElementById('form-presence').value = information.get('presence') ? '1' : '2';
        }

        if (information.get('info')) {
            document.getElementById('information')?.remove();
        }

        // wait until welcome screen is show.
        await util.changeOpacity(document.getElementById('welcome'), true);

        // remove loading screen and show welcome screen.
        await util.changeOpacity(document.getElementById('loading'), false).then((el) => el.remove());
    };

    /**
     * Danh sách ảnh Khoảnh Khắc.
     *
     * Fix cứng 10 ảnh:
     * 01.jpg -> 10.jpg
     *
     * Chỉ cần thay ảnh trong folder.
     *
     * @returns {string[]}
     */
    const getKhoanhKhacImages = () => {
        return Array.from(
            { length: 10 },
            (_, i) =>
                `./assets/images/Khoanh_Khac/${String(i + 1).padStart(2, '0')}.jpg`
        );
    };

    /**
     * Shuffle mảng bằng Fisher-Yates.
     *
     * @param {string[]} array
     * @returns {string[]}
     */
    const shuffle = (array) => {
        const result = [...array];

        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [result[i], result[j]] = [result[j], result[i]];
        }

        return result;
    };

    /**
     * Tạo ảnh.
     *
     * Vẫn sử dụng cơ chế lazy-load của image.js:
     *
     * src      = placeholder
     * data-src = ảnh thật
     *
     * @param {string} src
     * @returns {HTMLImageElement}
     */
    const createGalleryImage = (src) => {
        const img = document.createElement('img');

        img.src = './assets/images/placeholder.webp';
        img.setAttribute('data-src', src);

        img.alt = 'Khoảnh khắc';
        img.loading = 'lazy';

        img.className =
            'd-block w-100 rounded shadow cursor-pointer';

        img.style.height = 'auto';
        img.style.objectFit = 'contain';

        img.setAttribute(
            'onclick',
            'undangan.guest.modal(this)'
        );

        return img;
    };

    /**
     * Tạo Carousel Item.
     *
     * @param {string} src
     * @param {boolean} active
     * @returns {HTMLDivElement}
     */
    const createCarouselItem = (src, active = false) => {
        const item = document.createElement('div');

        item.className = active
            ? 'carousel-item active'
            : 'carousel-item';

        item.appendChild(
            createGalleryImage(src)
        );

        return item;
    };

    /**
     * Tạo indicator.
     *
     * @param {string} carouselId
     * @param {number} index
     * @param {boolean} active
     * @returns {HTMLButtonElement}
     */
    const createCarouselIndicator = (
        carouselId,
        index,
        active = false
    ) => {
        const button = document.createElement('button');

        button.type = 'button';

        button.setAttribute(
            'data-bs-target',
            `#${carouselId}`
        );

        button.setAttribute(
            'data-bs-slide-to',
            String(index)
        );

        button.setAttribute(
            'aria-label',
            `Ảnh ${index + 1}`
        );

        if (active) {
            button.classList.add('active');
            button.setAttribute(
                'aria-current',
                'true'
            );
        }

        return button;
    };

    /**
     * Build Bootstrap Carousel.
     *
     * @param {string} carouselId
     * @param {string[]} images
     * @returns {void}
     */
    const buildCarousel = (carouselId, images) => {
        const carousel =
            document.getElementById(carouselId);

        if (!carousel) {
            return;
        }

        const inner =
            carousel.querySelector('.carousel-inner');

        const indicators =
            carousel.querySelector('.carousel-indicators');

        if (!inner) {
            return;
        }

        /*
        * Xóa toàn bộ item cũ.
        */
        inner.innerHTML = '';

        /*
        * Xóa toàn bộ indicator cũ.
        */
        if (indicators) {
            indicators.innerHTML = '';
        }

        /*
        * Tạo lại toàn bộ ảnh.
        */
        images.forEach((src, index) => {

            inner.appendChild(
                createCarouselItem(
                    src,
                    index === 0
                )
            );

            if (indicators) {
                indicators.appendChild(
                    createCarouselIndicator(
                        carouselId,
                        index,
                        index === 0
                    )
                );
            }
        });
    };

    /**
     * Build 2 Carousel.
     *
     * 10 ảnh:
     *
     * Carousel 1 = 5 ảnh
     * Carousel 2 = 5 ảnh
     *
     * Không trùng ảnh.
     *
     * @param {string[]} images
     * @returns {void}
     */
    const buildKhoanhKhac = (images) => {

        const shuffled = shuffle(images);

        const half = Math.floor(
            shuffled.length / 2
        );

        const carouselOne =
            shuffled.slice(0, half);

        const carouselTwo =
            shuffled.slice(half);

        buildCarousel(
            'carousel-image-one',
            carouselOne
        );

        buildCarousel(
            'carousel-image-two',
            carouselTwo
        );
    };

    /**
     * Build toàn bộ Desktop Slides.
     *
     * Toàn bộ 10 ảnh đều được sử dụng.
     *
     * @param {string[]} images
     * @returns {void}
     */
    const buildDesktopSlides = (images) => {

        /*
        * Lấy đúng container đang chứa
        * các .slide-desktop.
        */
        const slideContainer =
            document
                .getElementById('root')
                ?.querySelector(
                    '.d-sm-block .overflow-hidden.vw-100'
                );

        if (!slideContainer) {
            return;
        }

        /*
        * Xóa toàn bộ slide cũ.
        */
        slideContainer
            .querySelectorAll('.slide-desktop')
            .forEach((slide) => slide.remove());

        /*
        * Shuffle riêng cho Desktop.
        */
        const shuffled = shuffle(images);

        /*
        * Tạo toàn bộ 10 slide.
        */
        shuffled.forEach((src) => {

            const slide =
                document.createElement('div');

            slide.className =
                'position-absolute h-100 w-100 slide-desktop';

            slide.style.opacity = '0';

            const img =
                document.createElement('img');

            img.src =
                './assets/images/placeholder.webp';

            img.setAttribute(
                'data-src',
                src
            );

            img.alt = 'Ảnh nền';

            img.className =
                'bg-cover-home';

            img.style.maskImage = 'none';
            img.style.opacity = '30%';

            slide.appendChild(img);

            slideContainer.appendChild(slide);
        });
    };

    /**
     * Build toàn bộ hệ thống Khoảnh Khắc.
     *
     * @returns {void}
     */
    const buildKhoanhKhacImages = () => {

        const images =
            getKhoanhKhacImages();

        /*
        * 10 ảnh -> 5 + 5
        */
        buildKhoanhKhac(images);

        /*
        * Desktop -> toàn bộ 10 ảnh
        */
        buildDesktopSlides(images);
    };
    /**
     * @returns {void}
     */
    const pageLoaded = () => {
        lang.init();
        offline.init();
        comment.init();
        progress.init();

        config = storage('config');
        information = storage('information');

        /*
        * Phải build ảnh TRƯỚC image.init()
        * để image.js nhận được toàn bộ <img> mới.
        */
        buildKhoanhKhacImages();

        const vid = video.init();
        const img = image.init();
        const aud = audio.init();
        const lib = loaderLibs();
        const token = document.body.getAttribute('data-key');
        const params = new URLSearchParams(window.location.search);

        window.addEventListener('resize', util.debounce(slide));
        document.addEventListener('undangan.progress.done', () => booting());
        document.addEventListener('hide.bs.modal', () => document.activeElement?.blur());
        document.getElementById('button-modal-download').addEventListener('click', (e) => {
            img.download(e.currentTarget.getAttribute('data-src'));
        });

        if (!token || token.length <= 0) {
            document.getElementById('comment')?.remove();
            document.querySelector('a.nav-link[href="#comment"]')?.closest('li.nav-item')?.remove();

            vid.load();
            img.load();
            aud.load();
            lib.load({ confetti: document.body.getAttribute('data-confetti') === 'true' });
        }

        if (token && token.length > 0) {
            // add 2 progress for config and comment.
            // before img.load();
            progress.add();
            progress.add();

            // if don't have data-src.
            if (!img.hasDataSrc()) {
                img.load();
            }

            session.guest(params.get('k') ?? token).then(({ data }) => {
                document.dispatchEvent(new Event('undangan.session'));
                progress.complete('config');

                if (img.hasDataSrc()) {
                    img.load();
                }

                vid.load();
                aud.load();
                lib.load({ confetti: data.is_confetti_animation });

                comment.show()
                    .then(() => progress.complete('comment'))
                    .catch(() => progress.invalid('comment'));

            }).catch(() => progress.invalid('config'));
        }
    };

    /**
     * @returns {object}
     */
    const init = () => {
        theme.init();
        session.init();

        if (session.isAdmin()) {
            storage('user').clear();
            storage('owns').clear();
            storage('likes').clear();
            storage('session').clear();
            storage('comment').clear();
        }

        window.addEventListener('load', () => {
            pool.init(pageLoaded, [
                'image',
                'video',
                'audio',
                'libs',
                'gif',
            ]);
        });

        return {
            util,
            theme,
            comment,
            guest: {
                open,
                modal,
                showStory,
                closeInformation,
            },
        };
    };

    return {
        init,
    };
})();