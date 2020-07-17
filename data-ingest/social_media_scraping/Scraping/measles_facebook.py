from facebook_scraper import get_posts

import csv
import re
import os

import pandas as pd
from pandas import ExcelFile
import numpy as np


#create a dictionary facebook_username that maps country name to facebook username
excel_file = 'Ministry of Health Info.xlsx'
facebook_accounts = pd.read_excel(excel_file, sheet_name='Sheet3', header = 0, usecols=[0,3]).fillna(value = 0)
facebook_username = {}
for i in range(facebook_accounts.shape[0] -2):
    url = facebook_accounts.iloc[i, 1]
    country = facebook_accounts.iloc[i, 0]
    if url==0:
        facebook_username[country] = None
    else:
        match = 'facebook.com\/(.*?)\/{0,1}$'
        facebook_username[country] = re.search(match, url).group(1)

def find_cases(country):
    username = facebook_username[country]
    if username is None:
        return 'No Facebook Account'

    #download all posts with the phrase 'measles' to a csv file named country_posts.csv
    def get_fb_posts(username):
        posts = []
        for post in get_posts(username, pages=100): #page number determines number of posts it goes through
            #larger page number finds more posts but takes longer (the entire process takes kind of a long time anyway)
            if 'measles' in post['text']:
                posts.append({'date': post['time'], 'text': post['text']})

        if posts != []:
            df_pd = pd.DataFrame(posts)
            #df_pd.to_csv('{}_posts.csv'.format(country))
            return df_pd
        else:
            return 'No Facebook Posts about Measles'

    posts = get_fb_posts(username)
    if not isinstance(posts, pd.DataFrame):
        return posts

    print('facebook posts found')


    #detect the caseload value in the post for each post, output a csv file with year/month/day of post and caseload reported
    def get_reported(posts):
        reported = []
        for i in range(posts.shape[0]):
            date = posts.iloc[i, 0]
            post = posts.iloc[i, 1]
            
            match_1 = '([0-9]+) (?:cases|measles cases|confirmed cases)'
            match_2 = '([0-9]+\,[0-9]+) (?:cases|measles cases|cases of measles)'

            if re.search(match_2, post):
                reported_val = re.search(match_2, post).group(1)
            elif re.search(match_1, post):
                reported_val = re.search(match_1, post).group(1)
            else:
                reported_val = None
                reported_num = None

            if reported_val:
                nums = [int(i) for i in reported_val if i.isdigit()] 
                func = lambda nums: int(''.join(str(i) for i in nums))
                reported_num = func(nums)
            
            if reported_num:
                reported.append(
                    {
                        'year': date.year,
                        'month': date.month,
                        'day': date.day,
                        'reported': reported_num
                    }
                )
        
        if reported == []:
            return 'No Facebook Caseload Data'
        else:
            reported_df = pd.DataFrame(reported)
            #reported_df.to_csv('{}_reported_facebook.csv'.format(country), index=False)
            return reported

    reported = get_reported(posts)
    if type(reported) is not list:
        return reported

    print('facebook reported values found')


    def get_caseload(reported):
        if reported:
            report_monthly = [
                    {
                        'monthname': f"{reported[0]['month']} {reported[0]['year']}",
                        'month': int(reported[0]['month']),
                        'year': int(reported[0]['year']),
                        'cumulative_total': 0
                    }
                            ]
            a = 0

            for post in reported:
                if not np.isnan(post['month']) and not np.isnan(post['year']):
                    monthname = f"{post['month']} {post['year']}"
                    
                    if report_monthly[a]['monthname'] == monthname:
                        if type(post['reported']) == int:
                            report_monthly[a]['cumulative_total'] = max(report_monthly[a]['cumulative_total'], post['reported'])
                        else:
                            report_monthly[a]['cumulative_total'] = report_monthly[a]['cumulative_total']
                    else:
                        a += 1
                        report_monthly.append({})
                        report_monthly[a]['monthname'] = monthname
                        report_monthly[a]['month'] = int(post['month'])
                        report_monthly[a]['year'] = int(post['year'])
                        if type(post['reported']) == int:
                            report_monthly[a]['cumulative_total'] = post['reported']
                        else:
                            report_monthly[a]['cumulative_total'] = 0

                caseload_month = []
                for i in range(len(report_monthly)-1):
                    caseload_month.append(
                        {
                            'month': report_monthly[i]['month'],
                            'year': report_monthly[i]['year'],
                            'caseload': report_monthly[i]['cumulative_total']-report_monthly[i+1]['cumulative_total'],              
                        }
                    )
                caseload_month.append(
                    {
                            'month': report_monthly[-1]['month'],
                            'year': report_monthly[-1]['year'],
                            'caseload': report_monthly[-1]['cumulative_total']              
                        }
                    )

            report_monthly_df = pd.DataFrame(report_monthly)
            monthly_df = pd.DataFrame(caseload_month)
            #monthly_df.to_csv('{}_caseload_facebook.csv'.format(country), index=False)
            return (report_monthly_df, monthly_df)
        else:
            return None

    caseload = get_caseload(reported)
    print('facebook scraped')
    return caseload


if __name__ == '__main__':
    print(find_cases('Portugal'))