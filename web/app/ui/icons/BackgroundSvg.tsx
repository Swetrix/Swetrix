import cx from 'clsx'
import React from 'react'

interface BackgroundSvgProps {
  className?: string
  type: 'shapes' | 'circle' | 'semicircle' | 'twolinecircle' | 'threecircle' | 'twolinecircle2'
  children?: React.ReactNode
  theme: 'dark' | 'light'
}

const BackgroundSvg = ({ className, type, children, theme }: BackgroundSvgProps) => {
  if (type === 'shapes') {
    return (
      <svg
        className={className}
        width='112'
        height='112'
        viewBox='0 0 112 112'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <g opacity='0.3'>
          <path
            d='M96.9136 36.5354L110.571 36.3167L109.988 -0.000432262L73.6711 0.581055L73.8887 14.1353L96.5481 13.7725L96.9136 36.5354Z'
            fill={cx({ '#E4E4E4': theme === 'light', '#576780': theme === 'dark' })}
          />
          <path
            d='M72.7847 61.4494L86.339 61.2324L85.7559 24.9153L49.5422 25.4951L49.7615 39.1528L72.4209 38.79L72.7847 61.4494Z'
            fill={cx({ '#E4E4E4': theme === 'light', '#576780': theme === 'dark' })}
          />
          <path
            d='M48.5526 86.3665L62.2104 86.1478L61.6289 49.9341L25.3118 50.5156L25.5294 64.0699L48.1888 63.7071L48.5526 86.3665Z'
            fill={cx({ '#E4E4E4': theme === 'light', '#576780': theme === 'dark' })}
          />
          <path
            d='M24.4254 111.385L38.0832 111.167L37.5001 74.8497L1.18292 75.4312L1.40221 89.0889L24.0616 88.7261L24.4254 111.385Z'
            fill={cx({ '#E4E4E4': theme === 'light', '#576780': theme === 'dark' })}
          />
        </g>
      </svg>
    )
  }

  if (type === 'circle') {
    return (
      <svg
        className={className}
        width='117'
        height='284'
        viewBox='0 0 117 284'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <g opacity='0.2' clipPath='url(#clip0_180_2875)'>
          <path
            d='M142.097 0C63.5443 0 0 63.5443 0 142.097C0 220.456 63.5443 284.195 142.097 284.195C220.456 284.195 284.195 220.651 284.195 142.097C284 63.5443 220.456 0 142.097 0ZM142.097 275.034C68.6122 275.034 9.16129 215.583 9.16129 142.097C9.16129 68.6122 68.6122 9.16129 142.097 9.16129C215.583 9.16129 275.034 68.6122 275.034 142.097C275.034 215.388 215.388 275.034 142.097 275.034Z'
            fill={cx({ '#E4E4E4': theme === 'light', '#576780': theme === 'dark' })}
          />
          <path
            d='M142.099 30.6025C80.6984 30.6025 30.7986 80.5023 30.7986 141.902C30.7986 203.303 80.6984 253.202 142.099 253.202C203.499 253.202 253.398 203.498 253.398 142.097C253.398 80.5023 203.499 30.6025 142.099 30.6025ZM142.099 236.244C90.0546 236.244 47.7567 193.946 47.7567 141.902C47.7567 89.8585 90.0546 47.5607 142.099 47.5607C194.142 47.5607 236.44 89.8585 236.44 141.902C236.44 193.946 194.142 236.244 142.099 236.244Z'
            fill={cx({ '#E4E4E4': theme === 'light', '#576780': theme === 'dark' })}
          />
          <path
            d='M142.098 79.5278C107.597 79.5278 79.5284 107.596 79.5284 142.097C79.5284 176.598 107.402 204.667 142.098 204.667C176.599 204.667 204.668 176.598 204.668 142.097C204.473 107.596 176.599 79.5278 142.098 79.5278ZM142.098 175.624C123.581 175.624 108.572 160.615 108.572 142.097C108.572 123.58 123.581 108.571 142.098 108.571C160.616 108.571 175.624 123.58 175.624 142.097C175.624 160.615 160.616 175.624 142.098 175.624Z'
            fill={cx({ '#E4E4E4': theme === 'light', '#576780': theme === 'dark' })}
          />
        </g>
        <defs>
          <clipPath id='clip0_180_2875'>
            <rect width='284' height='284' fill='white' />
          </clipPath>
        </defs>
      </svg>
    )
  }

  if (type === 'semicircle') {
    return (
      <svg
        className={className}
        width='90'
        height='39'
        viewBox='0 0 90 39'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          d='M67.0128 35.3452C75.976 35.3452 83.2775 28.1547 83.2775 19.3277C83.2775 10.5007 75.976 3.31012 67.0128 3.31012L67.0128 35.3452Z'
          fill={cx({ '#F7F7F7': theme === 'light', '#576780': theme === 'dark' })}
        />
        <path
          d='M41.6388 35.3452C50.602 35.3452 57.9035 28.1547 57.9035 19.3277C57.9035 10.5007 50.602 3.31012 41.6388 3.31012L41.6388 35.3452Z'
          fill={cx({ '#F7F7F7': theme === 'light', '#576780': theme === 'dark' })}
        />
        <path
          d='M16.2648 35.3452C25.228 35.3452 32.5295 28.1547 32.5295 19.3277C32.5295 10.5007 25.228 3.31012 16.2648 3.31012L16.2648 35.3452Z'
          fill={cx({ '#F7F7F7': theme === 'light', '#576780': theme === 'dark' })}
        />
      </svg>
    )
  }

  if (type === 'twolinecircle') {
    return (
      <svg
        className={className}
        width='103'
        height='100'
        viewBox='0 0 103 100'
        fill={cx({ '#E4E4E4': theme === 'light', '#576780': theme === 'dark' })}
        xmlns='http://www.w3.org/2000/svg'
      >
        <g opacity='0.2' clipPath='url(#clip0_561_1360)'>
          <path
            d='M97.5669 0C43.6308 0 0 43.6308 0 97.5669C0 151.369 43.6308 195.134 97.5669 195.134C151.369 195.134 195.134 151.503 195.134 97.5669C195 43.6308 151.369 0 97.5669 0ZM97.5669 188.844C47.1105 188.844 6.29032 148.023 6.29032 97.5669C6.29032 47.1105 47.1105 6.29032 97.5669 6.29032C148.023 6.29032 188.844 47.1105 188.844 97.5669C188.844 147.89 147.89 188.844 97.5669 188.844Z'
            fill={cx({ '#E4E4E4': theme === 'light', '#576780': theme === 'dark' })}
          />
          <path
            d='M97.5677 21.0125C55.4092 21.0125 21.147 55.2746 21.147 97.4332C21.147 139.592 55.4092 173.854 97.5677 173.854C139.726 173.854 173.988 139.726 173.988 97.567C173.988 55.2746 139.726 21.0125 97.5677 21.0125ZM97.5677 162.21C61.8333 162.21 32.7908 133.168 32.7908 97.4332C32.7908 61.6988 61.8333 32.6562 97.5677 32.6562C133.302 32.6562 162.345 61.6988 162.345 97.4332C162.345 133.168 133.302 162.21 97.5677 162.21Z'
            fill={cx({ '#E4E4E4': theme === 'light', '#576780': theme === 'dark' })}
          />
        </g>
        <defs>
          <clipPath id='clip0_561_1360'>
            <rect width='195' height='195' fill='white' />
          </clipPath>
        </defs>
      </svg>
    )
  }

  if (type === 'twolinecircle2') {
    return (
      <svg
        className={className}
        width='183'
        height='182'
        viewBox='0 0 183 182'
        fill={cx({ '#E4E4E4': theme === 'light', '#576780': theme === 'dark' })}
        xmlns='http://www.w3.org/2000/svg'
      >
        <g opacity='0.2' clipPath='url(#clip0_561_1038)'>
          <path
            d='M142.097 -102C63.5443 -102 0 -38.4557 0 40.0975C0 118.456 63.5443 182.195 142.097 182.195C220.456 182.195 284.195 118.651 284.195 40.0975C284 -38.4557 220.456 -102 142.097 -102ZM142.097 173.034C68.6122 173.034 9.16129 113.583 9.16129 40.0975C9.16129 -33.3878 68.6122 -92.8387 142.097 -92.8387C215.583 -92.8387 275.034 -33.3878 275.034 40.0975C275.034 113.388 215.388 173.034 142.097 173.034Z'
            fill={cx({ '#E4E4E4': theme === 'light', '#576780': theme === 'dark' })}
          />
          <path
            d='M142.099 -71.3972C80.6984 -71.3972 30.7986 -21.4974 30.7986 39.9027C30.7986 101.303 80.6984 151.203 142.099 151.203C203.499 151.203 253.398 101.498 253.398 40.0976C253.398 -21.4974 203.499 -71.3972 142.099 -71.3972ZM142.099 134.245C90.0546 134.245 47.7567 91.9466 47.7567 39.9027C47.7567 -12.1412 90.0546 -54.4391 142.099 -54.4391C194.142 -54.4391 236.44 -12.1412 236.44 39.9027C236.44 91.9466 194.142 134.245 142.099 134.245Z'
            fill={cx({ '#E4E4E4': theme === 'light', '#576780': theme === 'dark' })}
          />
        </g>
        <defs>
          <clipPath id='clip0_561_1038'>
            <rect width='284' height='284' fill='white' transform='translate(0 -102)' />
          </clipPath>
        </defs>
      </svg>
    )
  }

  if (type === 'threecircle') {
    return (
      <svg
        width='115'
        height='205'
        viewBox='0 0 115 205'
        fill={cx({ '#E4E4E4': theme === 'light', '#576780': theme === 'dark' })}
        xmlns='http://www.w3.org/2000/svg'
      >
        <g opacity='0.2' clipPath='url(#clip0_561_1345)'>
          <path
            d='M102.57 0C45.8682 0 0 45.8682 0 102.57C0 159.132 45.8682 205.141 102.57 205.141C159.132 205.141 205.141 159.272 205.141 102.57C205 45.8682 159.132 0 102.57 0ZM102.57 198.528C49.5264 198.528 6.6129 155.614 6.6129 102.57C6.6129 49.5264 49.5264 6.6129 102.57 6.6129C155.614 6.6129 198.528 49.5264 198.528 102.57C198.528 155.474 155.474 198.528 102.57 198.528Z'
            fill={cx({ '#E4E4E4': theme === 'light', '#576780': theme === 'dark' })}
          />
          <path
            d='M102.571 22.0898C58.2507 22.0898 22.2314 58.1091 22.2314 102.43C22.2314 146.75 58.2507 182.769 102.571 182.769C146.892 182.769 182.911 146.891 182.911 102.57C182.911 58.1091 146.892 22.0898 102.571 22.0898ZM102.571 170.528C65.0043 170.528 34.4724 139.997 34.4724 102.43C34.4724 64.8627 65.0043 34.3307 102.571 34.3307C140.138 34.3307 170.67 64.8627 170.67 102.43C170.67 139.997 140.138 170.528 102.571 170.528Z'
            fill={cx({ '#E4E4E4': theme === 'light', '#576780': theme === 'dark' })}
          />
          <path
            d='M102.571 57.4053C77.6668 57.4053 57.406 77.6661 57.406 102.57C57.406 127.474 77.5261 147.735 102.571 147.735C127.475 147.735 147.735 127.474 147.735 102.57C147.595 77.6661 127.475 57.4053 102.571 57.4053ZM102.571 126.77C89.2042 126.77 78.3703 115.936 78.3703 102.57C78.3703 89.2035 89.2042 78.3696 102.571 78.3696C115.937 78.3696 126.771 89.2035 126.771 102.57C126.771 115.936 115.937 126.77 102.571 126.77Z'
            fill={cx({ '#E4E4E4': theme === 'light', '#576780': theme === 'dark' })}
          />
        </g>
        <defs>
          <clipPath id='clip0_561_1345'>
            <rect width='205' height='205' fill='white' />
          </clipPath>
        </defs>
      </svg>
    )
  }

  return (
    <svg width='112' height='112' viewBox='0 0 112 112' fill='none' xmlns='http://www.w3.org/2000/svg'>
      {children}
    </svg>
  )
}

export default BackgroundSvg
