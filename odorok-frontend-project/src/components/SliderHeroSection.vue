<template>
  <section class="slider-hero-section">
    <div class="swiper-container slideshow">
      <div class="swiper-wrapper">
        <div class="swiper-slide slide">
          <div class="slide-image" style="background-image: url('/slider-1.avif')"></div>
          <span class="slide-title">나를 위한 건강 여정</span>
        </div>

        <div class="swiper-slide slide">
          <div class="slide-image" style="background-image: url('/slider-2.jpg')"></div>
          <span class="slide-title">소중한 추억까지</span>
        </div>

        <div class="swiper-slide slide">
          <div class="slide-image" style="background-image: url('/slider-3.webp')"></div>
          <span class="slide-title">오도록과 함께 하세요</span>
        </div>
      </div>

      <div class="slideshow-pagination"></div>

      <div class="slideshow-navigation">
        <div class="slideshow-navigation-button prev">
          <span class="fas fa-chevron-left"></span>
        </div>
        <div class="slideshow-navigation-button next">
          <span class="fas fa-chevron-right"></span>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { onMounted, onUnmounted } from 'vue'
import { Swiper } from 'swiper'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

export default {
  name: 'SliderHeroSection',
  setup() {
    let slideshow = null

    // Charming function for text animation
    const charming = (el, options = {}) => {
      const tagName = options.tagName || 'span'
      const classPrefix = options.classPrefix || 'char'
      let counter = 1

      const wrapText = (textNode) => {
        const parent = textNode.parentNode
        const text = textNode.nodeValue
        const textLength = text.length
        let i = -1

        while (++i < textLength) {
          const span = document.createElement(tagName)
          if (classPrefix) {
            span.className = classPrefix + counter
            counter++
          }
          span.appendChild(document.createTextNode(text[i]))
          parent.insertBefore(span, textNode)
        }
        parent.removeChild(textNode)
      }

      const traverse = (node) => {
        const childNodes = Array.prototype.slice.call(node.childNodes)
        const childNodesLength = childNodes.length
        let i = -1

        while (++i < childNodesLength) {
          traverse(childNodes[i])
        }
        if (node.nodeType === Node.TEXT_NODE) {
          wrapText(node)
        }
      }

      traverse(el)
      return el
    }

    // Slideshow class
    class Slideshow {
      constructor(el) {
        this.DOM = { el: el }
        
        this.config = {
          slideshow: {
            delay: 3000,
            pagination: {
              duration: 3,
            }
          }
        }
        
        this.init()
      }

      init() {
        const self = this
        
        // Charmed title
        this.DOM.slideTitle = this.DOM.el.querySelectorAll('.slide-title')
        this.DOM.slideTitle.forEach((slideTitle) => {
          charming(slideTitle)
        })
        
        // Set the slider
        this.slideshow = new Swiper(this.DOM.el, {
          modules: [Autoplay, Navigation, Pagination],
          loop: true,
          autoplay: {
            delay: this.config.slideshow.delay,
            disableOnInteraction: false,
          },
          speed: 500,
          preloadImages: true,
          updateOnImagesReady: true,
          
          pagination: {
            el: '.slideshow-pagination',
            clickable: true,
            bulletClass: 'slideshow-pagination-item',
            bulletActiveClass: 'active',
            clickableClass: 'slideshow-pagination-clickable',
            modifierClass: 'slideshow-pagination-',
            renderBullet: function (index, className) {
              const slideIndex = index
              const number = (index <= 8) ? '0' + (slideIndex + 1) : (slideIndex + 1)
              
              let paginationItem = '<span class="slideshow-pagination-item">'
              paginationItem += '<span class="pagination-number" style="color: #FFFFFF !important; font-weight: bold !important;">' + number + '</span>'
              paginationItem = (index <= 8) ? paginationItem + '<span class="pagination-separator"><span class="pagination-separator-loader"></span></span>' : paginationItem
              paginationItem += '</span>'
            
              return paginationItem
            },
          },

          navigation: {
            nextEl: '.slideshow-navigation-button.next',
            prevEl: '.slideshow-navigation-button.prev',
          },

          on: {
            init: function() {
              self.animate('next')
              // Start pagination animation after init
              setTimeout(() => {
                self.animatePagination(this, this.pagination.el)
              }, 100)
            },
            autoplayStart: function() {
              // Restart pagination animation when autoplay starts
              setTimeout(() => {
                self.animatePagination(this, this.pagination.el)
              }, 100)
            },
            autoplayStop: function() {
              // Stop pagination animation when autoplay stops
              const loaders = this.pagination.el.querySelectorAll('.pagination-separator-loader')
              loaders.forEach(loader => {
                loader.style.transition = 'none'
                loader.style.transform = 'scaleX(0)'
              })
            }
          }
        })
      
        this.initEvents()
      }

      initEvents() {
        this.slideshow.on('paginationUpdate', (swiper, paginationEl) => this.animatePagination(swiper, paginationEl))
        this.slideshow.on('slideNextTransitionStart', () => this.animate('next'))
        this.slideshow.on('slidePrevTransitionStart', () => this.animate('prev'))
      }

      animate(direction = 'next') {
        // Get the active slide
        this.DOM.activeSlide = this.DOM.el.querySelector('.swiper-slide-active')
        this.DOM.activeSlideImg = this.DOM.activeSlide.querySelector('.slide-image')
        this.DOM.activeSlideTitle = this.DOM.activeSlide.querySelector('.slide-title')
        this.DOM.activeSlideTitleLetters = this.DOM.activeSlideTitle.querySelectorAll('span')
      
        // Reverse if prev  
        this.DOM.activeSlideTitleLetters = direction === "next" ? this.DOM.activeSlideTitleLetters : [].slice.call(this.DOM.activeSlideTitleLetters).reverse()
      
        // Get old slide
        this.DOM.oldSlide = direction === "next" ? this.DOM.el.querySelector('.swiper-slide-prev') : this.DOM.el.querySelector('.swiper-slide-next')
        if (this.DOM.oldSlide) {
          this.DOM.oldSlideTitle = this.DOM.oldSlide.querySelector('.slide-title')
          this.DOM.oldSlideTitleLetters = this.DOM.oldSlideTitle.querySelectorAll('span')
          
          // Animate out
          this.DOM.oldSlideTitleLetters.forEach((letter, pos) => {
            letter.style.transition = 'all 0.3s ease'
            letter.style.transform = 'translateY(50%)'
            letter.style.opacity = '0'
          })
        }
      
        // Animate in
        this.DOM.activeSlideTitleLetters.forEach((letter, pos) => {
          letter.style.transition = 'all 0.6s ease'
          letter.style.transform = 'translateY(0%)'
          letter.style.opacity = '1'
        })
      
        // Animate background
        this.DOM.activeSlideImg.style.transition = 'transform 1.5s ease-out'
        this.DOM.activeSlideImg.style.transform = 'translateX(0)'
      }

      animatePagination(swiper, paginationEl) {
        this.DOM.paginationItemsLoader = paginationEl.querySelectorAll('.pagination-separator-loader')
        this.DOM.activePaginationItem = paginationEl.querySelector('.slideshow-pagination-item.active')
        this.DOM.activePaginationItemLoader = this.DOM.activePaginationItem ? this.DOM.activePaginationItem.querySelector('.pagination-separator-loader') : null
      
        // Reset all pagination loaders
        this.DOM.paginationItemsLoader.forEach(loader => {
          loader.style.transform = 'scaleX(0)'
          loader.style.transition = 'none'
        })
        
        // Animate active pagination loader
        if (this.DOM.activePaginationItemLoader) {
          // Force reflow
          this.DOM.activePaginationItemLoader.offsetHeight
          
          this.DOM.activePaginationItemLoader.style.transition = `transform ${this.config.slideshow.pagination.duration}s linear`
          this.DOM.activePaginationItemLoader.style.transform = 'scaleX(1)'
        }
      }
    }

    onMounted(() => {
      // Initialize slideshow directly
      slideshow = new Slideshow(document.querySelector('.slideshow'))
    })

    onUnmounted(() => {
      if (slideshow && slideshow.slideshow) {
        slideshow.slideshow.destroy(true, true)
      }
    })

    return {}
  }
}
</script>

<style scoped>
.slider-hero-section {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
}

.swiper-container {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

.slide {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  text-align: center;
  font-size: 18px;
  background: #fff;
  overflow: hidden;
}

.slide-image {
  position: absolute;
  top: -200px;
  left: -200px;
  width: calc(100% + 400px);
  height: calc(100% + 400px);
  background-position: 50% 50%;
  background-size: cover;
}

.slide-title {
  font-size: 4rem;
  line-height: 1;
  max-width: 50%;
  white-space: normal;
  word-break: break-word;
  color: #FFF;
  z-index: 100;
  font-family: 'Oswald', sans-serif;
  text-transform: uppercase;
  font-weight: normal;
}

@media (min-width: 45em) {
  .slide-title {
    font-size: 7vw;
    max-width: none;
  }
}

.slide-title span {
  white-space: pre;
  display: inline-block;
  opacity: 0;
}

.slideshow {
  position: relative;
}

.slideshow-pagination {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  width: auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  transition: .3s opacity;
  z-index: 10;
  gap: 1.5rem;
}

.slideshow-pagination-item {
  display: flex;
  align-items: center;
}

.slideshow-pagination-item .pagination-number {
  opacity: 0.5;
  color: #FFFFFF !important;
  font-weight: bold;
}

.slideshow-pagination-item:hover, 
.slideshow-pagination-item:focus {
  cursor: pointer;
}

.slideshow-pagination-item:last-of-type .pagination-separator {
  width: 0;
}

.slideshow-pagination-item.active .pagination-number {
  opacity: 1;
  color: #FFFFFF !important;
  font-weight: bold;
}

.slideshow-pagination-item.active .pagination-separator {
  width: 10vw;
}

.slideshow-navigation-button {
  position: absolute;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 5rem;
  z-index: 1000;
  transition: all .3s ease;
  color: #FFF;
}

.slideshow-navigation-button:hover, 
.slideshow-navigation-button:focus {
  cursor: pointer;
  background: transparent;
}

.slideshow-navigation-button.prev {
  left: 0;
}

.slideshow-navigation-button.next {
  right: 0;
}

.pagination-number {
  font-size: 1.8rem;
  color: #FFFFFF !important;
  font-family: 'Oswald', sans-serif;
  font-weight: bold;
  padding: 0 1.5rem;
}

/* 더 강력한 선택자로 하얀색 강제 적용 */
.slideshow-pagination .slideshow-pagination-item .pagination-number,
.slideshow-pagination .slideshow-pagination-item.active .pagination-number,
.slider-hero-section .slideshow-pagination .slideshow-pagination-item .pagination-number,
.slider-hero-section .slideshow-pagination .slideshow-pagination-item.active .pagination-number {
  color: #FFFFFF !important;
  font-weight: bold !important;
}

/* 모든 pagination-number에 하얀색 강제 적용 */
.pagination-number,
span.pagination-number,
.slideshow-pagination-item span,
.slideshow-pagination-item .pagination-number,
.slider-hero-section .pagination-number,
.slider-hero-section span.pagination-number {
  color: #FFFFFF !important;
  font-weight: bold !important;
}

/* 최고 우선순위로 하얀색 강제 적용 */
.slider-hero-section .slideshow-pagination .slideshow-pagination-item .pagination-number {
  color: #FFFFFF !important;
  font-weight: bold !important;
  text-shadow: none !important;
}

.pagination-separator {
  display: none;
  position: relative;
  width: 40px;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  transition: all .3s ease;
  border-radius: 2px;
}

@media (min-width: 45em) {
  .pagination-separator {
    display: block;
  }
}

.pagination-separator-loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #FFFFFF;
  transform-origin: 0 0;
  transform: scaleX(0);
  transition: transform 3s linear;
  border-radius: 2px;
}
</style>
