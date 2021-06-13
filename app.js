'use strict';

import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';

import {
  OrbitControls
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js';

function main() {
  // create WebGLRenderer
  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas
  });

  // create camera
  const fov = 75;
  const aspect = 2;
  const near = 0.1;
  const far = 25;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 4;

  // create OrbitControls
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0); // OrbitControls가 움직이는 camera의 시선을 (0, 0, 0) 원점으로 고정시킴
  controls.update(); // OrbitControls의 속성값을 바꿔줬으면 업데이트 메서드를 호출해줘야 함.

  // create scene and assign its background color to white
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('white'); // 컬러 객체를 생성한 뒤, background에 할당함.

  // 전개연산자로 x, y, z좌표값을 받아서 directional light(직사광)을 생성하고 그것의 position값을 전개연산자로 할당해주는 함수
  function addLight(...pos) {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(...pos); // 전개연산자로 전달받은 3개의 좌표값을 하나하나 복사하여 positio(Vector3)의 x, y, z에 각각 지정해줌.
    scene.add(light);
  }
  addLight(-1, 2, 4);
  addLight(1, -1, -2); // 정육면체들의 옆면에서도 빛을 받을 수 있게 조명을 하나 더 만들어 줌.

  // create BoxGeometry
  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  // 퐁-머티리얼의 투명도 속성을 조절해서 투명한 정육면체 메쉬를 생성하는 함수
  function makeInstance(geometry, color, x, y, z) {
    /**
     * THREE.DoubleSide로 렌더링하면 한 가지 문제점이 있음.
     * 큐브 메쉬들끼리는 뒷쪽 메쉬들이 비쳐지는데,
     * 하나의 큐브 메쉬 안에서는 뒷면이 안보이는 상황도 생긴다는 거...
     * 
     * 이는 WebGL이 3D요소를 렌더링하는 방식으로 인해 생겨나는 문제임.
     * WebGL은 geometry의 각 삼각형을 한번에 하나씩 렌더링하는데,
     * 각 삼각형의 픽셀을 하나씩 렌더링 할때마다 depth(깊이) 정보를 기록해 놓음.
     * 그래서 어떤 픽셀이 먼저 그려지고 다음 픽셀이 그 위에 그려질 때, 먼저 그려진 픽셀보다 깊이값이 깊다면, 
     * 즉 카메라에서 더 멀리 떨어진 픽셀이라면 해당 픽셀을 렌더링하지 않는다는 것.
     * 
     * 대부분의 불투명한 물체를 렌더링할 때 이러한 점은 문제가 되지 않지만 투명한 물체에서는 문제가 된다.
     * 
     * 이거를 해결하려면 투명한 물체를 둘로 나눠서(backSide, frontSide) 
     * 뒤에 있는 물체(THREE.BackSide)를 앞에 있는 물체(THREE.FrontSide)보다 먼저 그려줘야 함.
     * 그러면 깊이 상으로는 뒤에 있더라도, 먼저 그려진 픽셀이기 때문에 뒤에 있는 물체들도 온전히 렌더링될거임. 
     *  
     * 참고로 큐브 메쉬들끼리는 이런 문제가 없었던 이유가
     * 이러한 해결방법을 Mesh 객체에서는 자동으로 처리해줬기 때문임.
     * 다만 Material에서는 그렇지 못했기 때문에 하나의 큐브메쉬 안에서는 뒤에 있는 면이 안보였던 것.
     * 
     * 따라서 각각의 큐브를 렌더링 할 때, 둘로 나눠서 렌더링 해야 함.
     * 뒷면만 렌더링된 큐브 + 앞면만 렌더링된 큐브
     * 그리고 순서 또한 뒷면 렌더링 큐브를 먼저 렌더링 해줘야 함.
     * 
     * 이거를 퐁-머티리얼의 side 속성값들이 담긴 배열에 대해서 forEach로 반복수행 해줌으로써 해결할거임 
     */
    [THREE.BackSide, THREE.FrontSide].forEach((side) => {
      const material = new THREE.MeshPhongMaterial({
        color,
        transparent: true, // 정육면체를 투명하게 만들려면 먼저 퐁-머티리얼의 transparent 속성을 켜야 함.
        opacity: 0.5, // 그리고 얼만큼 투명하게 해줄건지를 opacity에 0 ~ 1까지의 값을 할당해서 지정해줘야 함. 여기서 투명도는 50%겠지
        // side: THREE.DoubleSide, // side는 값을 별도로 지정해주지 않으면 THREE.FrontSide, 즉 앞면만 렌더해 줌. 근데 이거는 투명한 큐브들이니까 양면을 모두 렌더해줘야 함.
        side, // 얘는 한 마디로 인자로 받아오는 side를 가져와서 side: side 이렇게 할당하겠다는 거임. side에는 각 forEach loop마다 THREE.BackSide, THREE.FrontSide가 할당되겠지
      });

      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      // 큐브가 3개일 때의 예제에서는 x값만 받아서 지정해줬지만, 여기서는 2*2*2 그리드에 8개의 정육면체를 배치해야 하므로 x, y, z값 모두 받아와서 지정해줘야 함.
      cube.position.set(x, y, z);

      return cube;
    });
    // 이렇게 함으로써 큐브 하나당 결과적으로는 2개씩 큐브 메쉬가 생성됨(뒷면만 렌더링된 큐브메쉬 + 앞면만 렌더링된 큐브메쉬)
  }

  // h, s, l값을 전달받은 뒤, 새로운 Color 객체를 만들고, 전달받은 h, s, l값을 넘겨주면서 setHSL 메서드를 호출해 각 육면체의 컬러 객체를 만든 뒤 리턴해 줌.
  function hsl(h, s, l) {
    return (new THREE.Color()).setHSL(h, s, l);
  }

  // d값(0.8)을 기준으로 부호만 바꿔서 각 큐브들의 위치값을 전달해준 뒤, makeInstance 함수를 호출해서 8개의 큐브를 생성함
  {
    const d = 0.8;
    makeInstance(geometry, hsl(0 / 8, 1, 0.5), -d, -d, -d); // 0 / 8 ~ 7 / 8 까지의 값을 h값으로 전달해 줌 -> 큐브마다 각자 다른 색상값이 나오겠지
    makeInstance(geometry, hsl(1 / 8, 1, 0.5), d, -d, -d);
    makeInstance(geometry, hsl(2 / 8, 1, 0.5), -d, d, -d);
    makeInstance(geometry, hsl(3 / 8, 1, 0.5), d, d, -d);
    makeInstance(geometry, hsl(4 / 8, 1, 0.5), -d, -d, d);
    makeInstance(geometry, hsl(5 / 8, 1, 0.5), d, -d, d);
    makeInstance(geometry, hsl(6 / 8, 1, 0.5), -d, d, d);
    makeInstance(geometry, hsl(7 / 8, 1, 0.5), d, d, d);
  }

  // resize renderer
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }

    return needResize;
  }

  /**
   * 이거는 '불필요한 렌더링 제거' 예제에서 사용했던 변수값임.
   * 
   * 원래는 OrbitControls의 enableDamping을 활성화해서 관성 효과를 주면 
   * animate 메서드같은 update loop 안에서 update 메서드를 호출해줘야 하는데,
   * 이걸 호출하면 OrbitControls에 change 이벤트를 주도록 되어있음.
   * 
   * 그러다보니, animate 메서드가 실행되고 있는 와중에 
   * 실제로 OrbitControls에서 change 이벤트를 받아서 animate를 호출을 예약했는데, 그러고 난 뒤에
   * 내부에서 update 메서드를 호출함으로써 중복 호출 예약이 되는 문제가 발생하는거임.
   * 
   * 그래서 이 중복 호출 예약을 방지하기 위해서 requestAnimateIfNotRequested() 함수에서
   * 이 변수값을 true로 지정해주는거임. 그러면 animate가 진행중일 때 change이벤트가 발생해서 이미 호출예약이 되었음에도 불구하고
   * update 메서드 실행으로 인해서 다시 animate 함수를 예약호출 하려고 할 때, 
   * 이미 앞에서 change이벤트에 의해 예약호출이 되어 animateRequested값을 true로 바꿔놨기 때문에 
   * requestAnimateIfNotRequested() 함수의 if block을 통과하지 못함. 
   * 왜? 저값이 true라는 것은 '이미 한 번 예약됐습니다!' 라는 뜻이기 때문.
   * 
   * 근데 여기서는 animate 함수 내에서 update 메서드를 호출하는 건 아니니까 없어도 무방하기는 함.
   * 왜냐면 불필요한 렌더링을 제거하는 데 있어서 꼭 필요한 변수값이 아니기 때문에...
   */
  let animateRequested = false;

  // animate
  function animate() {
    animateRequested = undefined;

    // 리사이징된 렌더러의 사이즈에 맞춰서 카메라의 비율(aspect)도 업데이트 되어야 함.
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix(); // 값이 변경되었으니 업데이트 메서드 호출.
    }

    renderer.render(scene, camera);
  }

  animate();

  // requestAnimationFrame에 의해 animate 함수가 이미 한 번 예약되었는지 판단하여 예약 호출 여부를 결정해주는 함수
  function requestAnimateIfNotRequested() {
    if (!animateRequested) {
      animateRequested = true;
      requestAnimationFrame(animate);
    }
  }

  // OrbitControls가 DOMElement의 이벤트를 받아서 카메라에 변화가 생기는 change 이벤트가 발생했거나,
  // 브라우저에 리사이징 이벤트가 발생했을때 requestAnimateIfNotRequested()을 호출하여 animate 함수를 예약 호출함.
  controls.addEventListener('change', requestAnimateIfNotRequested);
  window.addEventListener('resize', requestAnimateIfNotRequested);
}

main();