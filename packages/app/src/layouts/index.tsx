import { useEffect, useMemo, useState } from 'react';
import { Button, Dropdown, Layout } from 'antd';
import {
  Link,
  Outlet,
  setLocale,
  useLocation,
  useModel,
  getLocale,
} from '@umijs/max';
import { GlobalLoading, LangSelector } from 'dds-component';
import { STORAGE_KEY } from '@/constants';
import LoginModal from '@/components/LoginModal';
import { LeftOutlined, LogoutOutlined, RightOutlined } from '@ant-design/icons';
import routes from '@/routes';
import classNames from 'classnames';
import { useLocale } from '@/locales/helper';
import CustomMenu from './menu';
import styles from './index.less';

const SLIDER_WIDTH = 226;
const SLIDER_COLLAPSED_WIDTH = 88;

export default () => {
  const { loading } = useModel('global');
  const { user, setUser, checkLoginStatus, limitLoginAction, onLogout } =
    useModel('user');
  const { pathname } = useLocation();
  const { localeText } = useLocale();
  const [collapsed, setCollapsed] = useState(true);

  /** Compute hide slider paths */
  const hideSiderPaths = useMemo(() => {
    const paths: string[] = [];
    routes.forEach((item) => {
      if (item.routes) {
        if (item.hideSider) {
          paths.push(...item.routes.map((sub) => sub.path));
        } else {
          item.routes.forEach((sub) => {
            // @ts-ignore
            if (sub?.hideSider) paths.push(sub.path);
          });
        }
      } else if (item.hideSider && item.path) {
        paths.push(item.path);
      }
    });
    return paths;
  }, []);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY.AUTH_TOKEN)) {
      setUser({
        isLogin: false,
      });
    }
  }, [localStorage.getItem(STORAGE_KEY.AUTH_TOKEN)]);

  const sliderWidth = collapsed
    ? `${SLIDER_COLLAPSED_WIDTH}px`
    : `${SLIDER_WIDTH}px`;

  const renderSilder = () => {
    if (hideSiderPaths.find((item) => item && pathname.includes(item))) {
      return <></>;
    } else {
      return (
        <>
          <div
            className={styles.fixSlider}
            style={{
              width: sliderWidth,
              minWidth: sliderWidth,
              maxWidth: sliderWidth,
            }}
          />
          <Layout.Sider
            className={styles.slider}
            theme="light"
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={SLIDER_WIDTH}
            collapsedWidth={SLIDER_COLLAPSED_WIDTH}
          >
            <div
              className={styles.sliderHeader}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <Link to="/">
                <img alt="logo" src={require('@/assets/images/favicon.png')} />
                {!collapsed && <h1>Deep Data Space</h1>}
              </Link>
            </div>
            <CustomMenu collapsed={collapsed} />
            <div
              className={classNames(styles.bottomActions, {
                [styles.collapsedActions]: collapsed,
              })}
            >
              {user.isLogin ? (
                <Dropdown
                  placement="topRight"
                  menu={{
                    items: [
                      {
                        title: '',
                        label: localeText('logout'),
                        key: 'accout-logout',
                        icon: <LogoutOutlined />,
                        onClick: onLogout,
                      },
                    ],
                  }}
                >
                  <div className={styles.userBlock}>
                    <Button type="text" className={styles.userBtn}>
                      {user.username?.slice(0, 2)}
                    </Button>
                    {!collapsed && (
                      <span className={styles.userName}>{user.username}</span>
                    )}
                  </div>
                </Dropdown>
              ) : (
                <Button
                  type="text"
                  className={styles.loginBtn}
                  onClick={limitLoginAction}
                >
                  {localeText('login')}
                </Button>
              )}
              <LangSelector getLocale={getLocale} setLocale={setLocale} />
            </div>
            <div
              onClick={() => setCollapsed(!collapsed)}
              className={styles.collapseBtn}
            >
              {collapsed ? <RightOutlined /> : <LeftOutlined />}
            </div>
          </Layout.Sider>
        </>
      );
    }
  };

  return (
    <GlobalLoading active={loading}>
      <Layout>
        {renderSilder()}
        <Layout>
          <Outlet />
        </Layout>
        <LoginModal />
      </Layout>
    </GlobalLoading>
  );
};
