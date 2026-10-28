import { act, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { LoadingState } from '../src/components/feedback/AsyncState.jsx';
afterEach(()=>vi.unstubAllGlobals());
it('uses an animated vector instead of a visible loading paragraph or bitmap',()=>{
 const {container}=render(<LoadingState label="Preparando tu campus…"/>);
 const status=screen.getByRole('status',{name:'Preparando tu campus…'});
 expect(status.querySelector('svg')).toHaveAttribute('aria-hidden','true');
 expect(status.querySelector('svg')).toHaveAttribute('focusable','false');
 expect(container.querySelector('img,canvas,p,.skeleton')).toBeNull();
 expect(container.querySelectorAll('animateTransform').length).toBeGreaterThan(0);
});
it('respects reduced motion and responds when the preference changes',()=>{
 let listener;const preference={matches:true,addEventListener:vi.fn((type,callback)=>{listener=callback;}),removeEventListener:vi.fn()};
 vi.stubGlobal('matchMedia',vi.fn(()=>preference));
 const {container,unmount}=render(<LoadingState/>);
 expect(container.querySelector('svg')).toHaveAttribute('data-motion','reduced');
 expect(container.querySelectorAll('animate,animateTransform')).toHaveLength(0);
 act(()=>{preference.matches=false;listener();});
 expect(container.querySelector('svg')).toHaveAttribute('data-motion','animated');
 expect(container.querySelectorAll('animateTransform').length).toBeGreaterThan(0);
 unmount();expect(preference.removeEventListener).toHaveBeenCalledWith('change',listener);
});
it('keeps gradient and wing references distinct when multiple sections are loading',()=>{
 const {container}=render(<><LoadingState/><LoadingState/></>);
 const ids=[...container.querySelectorAll('svg [id]')].map(node=>node.id);
 expect(new Set(ids).size).toBe(ids.length);
 for(const use of container.querySelectorAll('use'))expect(ids).toContain(use.getAttribute('href').slice(1));
});
