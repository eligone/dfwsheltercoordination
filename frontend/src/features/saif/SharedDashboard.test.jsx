/** Saif Yusuff: UC-8 component acceptance tests, including protected-data removal. */
import { render, screen, within, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect } from 'vitest';
import { createTestApp, signInAs } from '../../test/testApp.js';
import SharedDashboard from './SharedDashboard.jsx';

afterEach(cleanup);
describe('UC-8 Shared Dashboard screen', () => {
  it('TC-8-01 renders all six shelters and capacity fields', () => {
    render(<SharedDashboard app={signInAs(createTestApp(), 'rich')} />);
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(7);
    const expected = [['Richardson Animal Shelter','58','60','2','Near Full'],['Dallas Animal Services','310','320','10','Near Full'],['Collin County Animal Services','70','110','40','Open'],['Plano Animal Services','84','100','16','Open'],['Irving Animal Care Campus','41','90','49','Outdated'],['Carrollton Animal Services & Adoption Center','55','75','20','Open']];
    expected.forEach((cells,i) => cells.forEach(value => expect(within(rows[i+1]).getAllByText(value,{exact:true}).length).toBeGreaterThan(0)));
    expect(screen.getByText('2026-11-04 08:15')).toBeInTheDocument();
    expect(screen.getByRole('navigation').querySelectorAll('li')).toHaveLength(3);
  });
  it.each([[50,'Open'],[51,'Near Full'],[59,'Near Full'],[60,'Full'],[0,'Open']])('TC-8-02 renders %s/60 as %s', (dogs,status) => {
    const app=signInAs(createTestApp(),'rich'); app.state.shelters[0].dogsHoused=dogs;
    render(<SharedDashboard app={app} />);
    expect(within(screen.getAllByRole('row')[1]).getByText(status)).toBeInTheDocument();
  });
  it('TC-8-03 renders the exact empty state', () => {
    const app=signInAs(createTestApp(),'rich'); app.state.shelters=[];
    render(<SharedDashboard app={app} />);
    expect(screen.getByRole('status')).toHaveTextContent('No shelter data available.');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
  it('TC-8-04 protects data, validates sign-in, and removes rows after external sign-out', async () => {
    const app=createTestApp(); const user=userEvent.setup();
    render(<SharedDashboard app={app} />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Staff email'),'jdoe@richardson.example');
    await user.type(screen.getByLabelText('Password'),'wrong');
    await user.click(screen.getByRole('button',{name:'Sign in'}));
    expect(screen.getByRole('alert')).toHaveTextContent('Incorrect email or password.');
    await user.clear(screen.getByLabelText('Password'));
    await user.type(screen.getByLabelText('Password'),'pw-rich');
    await user.click(screen.getByRole('button',{name:'Sign in'}));
    expect(screen.getByRole('table')).toBeInTheDocument();
    app.auth.signOut();
    await waitFor(()=>expect(screen.queryByRole('table')).not.toBeInTheDocument());
    expect(screen.getByRole('button',{name:'Sign in'})).toBeInTheDocument();
  });
  it('shows missing timestamps and lets staff sign out', async () => {
    const app=signInAs(createTestApp(),'rich'); app.state.shelters[0].lastUpdated=null;
    render(<SharedDashboard app={app} />);
    expect(within(screen.getAllByRole('row')[1]).getByText('Not available')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button',{name:'Sign out'}));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
